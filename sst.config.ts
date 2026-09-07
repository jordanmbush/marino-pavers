/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST v4 — the whole infrastructure for marinopavers.com.
 *
 * One CloudFront distribution (the Router) fronts three things on one origin:
 *
 *   /            the static Astro build, from its own S3 bucket
 *   /media/*     the photo bucket: originals the client uploaded, the WebP
 *                renditions the processor made, and manifest.json
 *   /api/*       the admin Lambda (Function URL)
 *
 * Uploading an original to `originals/` in the media bucket fires the image
 * processor, which writes renditions and rebuilds manifest.json; the site
 * reads that manifest at runtime, so a new photo needs no deploy.
 *
 * AWS account 652346859306 (its own member account in the org so hosting
 * costs are isolated), SSO profile `marino-pavers`, region us-west-1. ACM
 * certificates for CloudFront are issued in us-east-1; SST handles that.
 *
 * Stages:
 *   production  marinopavers.com + www redirect, DNS on Cloudflare.
 *   dev         CloudFront URL only, no custom domain, so the pipeline is
 *               verifiable without holding the Cloudflare token.
 *   anything else → also domain-less; a throwaway stage can never take over
 *               the live hostname by accident.
 *
 * Env vars that gate production, read at deploy time and never committed:
 *   CLOUDFLARE_API_TOKEN            "Edit zone DNS" template, this zone only
 *   CLOUDFLARE_ZONE_ID              the zone's id
 *   CLOUDFLARE_DEFAULT_ACCOUNT_ID   SST's Cloudflare provider demands one even
 *                                   for a DNS-only deploy; a zone-scoped token
 *                                   can't look it up, so it is passed in.
 */

const DOMAIN = "marinopavers.com";
const REGION = "us-west-1";

/** Origins the admin API answers CORS for on non-production stages. */
const DEV_ORIGINS = ["http://localhost:4330", "https://dev.marinopavers.com"];

export default $config({
  app(input) {
    const production = input?.stage === "production";
    return {
      name: "marino-pavers",
      // `retain` on production so a stray `sst remove` can't delete the
      // buckets holding the live site and the client's photos.
      removal: production ? "retain" : "remove",
      protect: production,
      home: "aws",
      providers: {
        aws: {
          region: REGION,
          // A named profile locally; on a GitHub runner credentials come from
          // the OIDC role and naming a profile there fails the deploy.
          profile: process.env.CI ? undefined : "marino-pavers",
        },
        // Only production declares the Cloudflare provider. Declaring it on
        // every stage makes Pulumi authenticate it on every stage, so a
        // domain-less dev deploy would fail with "Invalid access token".
        ...(production ? { cloudflare: "6.16.0" as const } : {}),
      },
    };
  },

  async run() {
    const production = $app.stage === "production";
    // SST allows no top-level imports in this file; pull in the edge code here.
    const { redirectInjection } = await import("./infra/redirects");

    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    if (production && !zoneId) {
      throw new Error(
        "CLOUDFLARE_ZONE_ID is required for the production stage — it's what points marinopavers.com at this distribution. Export it (and CLOUDFLARE_API_TOKEN, CLOUDFLARE_DEFAULT_ACCOUNT_ID) before deploying.",
      );
    }

    const router = new sst.aws.Router("Router", {
      // Retired URLs answer 301 at the edge (infra/redirects.ts).
      edge: { viewerRequest: { injection: redirectInjection() } },
      domain: production
        ? {
            name: DOMAIN,
            // www exists to redirect, not to serve: two hostnames serving the
            // same HTML is a duplicate-content problem for search.
            redirects: [`www.${DOMAIN}`],
            dns: sst.cloudflare.dns({ zone: zoneId! }),
          }
        : undefined,
    });

    // The client's photos. Private; CloudFront reads it through the Router.
    // The default CORS rule stays permissive on purpose: the browser PUTs
    // originals straight to a presigned URL, and that request comes from the
    // site's origin.
    const media = new sst.aws.Bucket("Media", {
      access: "cloudfront",
      versioning: production,
    });
    // Only what the site reads is reachable: renditions and the manifest.
    // Originals and the per-item records stay private to the Lambdas.
    for (const path of ["/media/renditions", "/media/manifest.json"]) {
      router.routeBucket(path, media, {
        rewrite: { regex: "^/media/(.*)$", to: "/$1" },
      });
    }

    // One human logs in: the client. No self sign-up, admin-created only.
    const adminPool = new sst.aws.CognitoUserPool("AdminPool", {
      usernames: ["email"],
      transform: {
        userPool: (args) => {
          args.adminCreateUserConfig = { allowAdminCreateUserOnly: true };
          args.passwordPolicy = {
            minimumLength: 12,
            requireLowercase: true,
            requireUppercase: true,
            requireNumbers: true,
            requireSymbols: false,
            temporaryPasswordValidityDays: 7,
          };
          args.deletionProtection = production ? "ACTIVE" : "INACTIVE";
        },
      },
    });
    const adminClient = adminPool.addClient("Web", {
      transform: {
        client: (args) => {
          // The admin page signs in with a plain username/password call and
          // refreshes with the refresh token; nothing else is enabled.
          args.explicitAuthFlows = [
            "ALLOW_USER_PASSWORD_AUTH",
            "ALLOW_REFRESH_TOKEN_AUTH",
          ];
          args.preventUserExistenceErrors = "ENABLED";
          args.refreshTokenValidity = 30;
        },
      },
    });

    // Fires on every original the client uploads. sharp is a native module,
    // so it is installed into the bundle rather than bundled by esbuild.
    // 2 GB is about CPU, not memory: Lambda scales CPU with memory, and a
    // 20-megapixel JPEG resized four ways is a few seconds at this size.
    media.notify({
      notifications: [
        {
          name: "ProcessImage",
          events: ["s3:ObjectCreated:*"],
          filterPrefix: "originals/",
          function: {
            handler: "packages/functions/src/process-image.handler",
            architecture: "arm64",
            memory: "2048 MB",
            timeout: "2 minutes",
            link: [media],
            environment: { MEDIA_BUCKET: media.name },
            nodejs: { install: ["sharp"] },
          },
        },
      ],
    });

    // The admin API. CORS is handled inside the handler (so a dev server on
    // localhost can reach a deployed stage); the Function URL's own CORS is
    // off so the two never emit duplicate headers, which browsers reject.
    const adminApi = new sst.aws.Function("AdminApi", {
      handler: "packages/functions/src/admin-api.handler",
      architecture: "arm64",
      link: [media],
      environment: {
        MEDIA_BUCKET: media.name,
        COGNITO_USER_POOL_ID: adminPool.id,
        COGNITO_CLIENT_ID: adminClient.id,
        ALLOWED_ORIGINS: production ? "" : DEV_ORIGINS.join(","),
      },
      url: {
        cors: false,
        router: { instance: router, path: "/api" },
      },
    });

    const site = new sst.aws.StaticSite("Site", {
      path: "apps/web",
      build: {
        command: "npm run build",
        output: "dist",
      },
      router: { instance: router },
      errorPage: "404.html",
      /**
       * A wrong URL must answer 404, not 403. With only `s3:GetObject`
       * granted, S3 hides the difference between "missing" and "forbidden"
       * and CloudFront passes the 403 through — which search engines read
       * as a server fault. Granting the CloudFront service principal
       * `s3:ListBucket` is exactly what lets S3 answer NoSuchKey instead.
       * The bucket stays private; listing is granted to CloudFront only.
       */
      transform: {
        assets: (args) => {
          args.transform = {
            ...args.transform,
            policy: (policyArgs) => {
              policyArgs.policy = $resolve([
                policyArgs.policy,
                policyArgs.bucket,
              ]).apply(([policy, bucket]) => {
                const doc =
                  typeof policy === "string"
                    ? JSON.parse(policy)
                    : JSON.parse(JSON.stringify(policy));
                doc.Statement.push({
                  Effect: "Allow",
                  Principal: { Service: "cloudfront.amazonaws.com" },
                  Action: "s3:ListBucket",
                  Resource: `arn:aws:s3:::${bucket}`,
                });
                return JSON.stringify(doc);
              });
            },
          };
        },
      },
      // Baked into the build. The media URL must be absolute so pages can
      // pre-render the gallery; the API URL is empty on production so the
      // site calls its own origin and works from any hostname.
      environment: {
        PUBLIC_MEDIA_URL: production
          ? `https://${DOMAIN}/media`
          : $interpolate`${router.url}/media`,
        PUBLIC_API_URL: production ? "" : router.url,
        PUBLIC_COGNITO_CLIENT_ID: adminClient.id,
        PUBLIC_AWS_REGION: REGION,
      },
      /**
       * ⚠️ `fileOptions` REPLACES SST's default list, and SST only uploads
       * files that match some entry — keep the catch-all first. Precedence is
       * last-match-wins, so the most specific rule goes at the bottom.
       */
      assets: {
        fileOptions: [
          {
            files: "**",
            cacheControl: "public,max-age=3600,s-maxage=86400,must-revalidate",
          },
          // Content-hashed by the build: immutable forever.
          {
            files: "_astro/**",
            cacheControl: "public,max-age=31536000,immutable",
          },
          // Documents must revalidate or a deploy takes a day to show.
          {
            files: ["**/*.{html,xml,txt,json,webmanifest}"],
            cacheControl: "public,max-age=0,s-maxage=86400,must-revalidate",
          },
        ],
      },
    });

    return {
      url: router.url,
      site: site.url,
      stage: $app.stage,
      mediaBucket: media.name,
      userPoolId: adminPool.id,
      userPoolClientId: adminClient.id,
      adminApi: adminApi.url,
    };
  },
});
