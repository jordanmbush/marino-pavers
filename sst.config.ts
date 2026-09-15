/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST v4 — the whole infrastructure for marinopavers.com.
 *
 * One CloudFront distribution (the Router) fronts three things on one origin:
 *
 *   /            the static Astro build, from its own S3 bucket
 *   /media/*     the media bucket: the WebP renditions and transcoded MP4s
 *                the processors made, and manifest.json. Originals, the
 *                per-item records and the transcoder's captured frames sit
 *                outside the published prefixes and stay private.
 *   /api/*       the admin Lambda (Function URL)
 *
 * Uploading an original to `originals/` in the media bucket fires one of two
 * processors, chosen by the file's extension. A photo is resized in the
 * Lambda itself. A video is handed to MediaConvert, which writes the MP4
 * renditions and captures a frame; a second Lambda hears the job finish,
 * turns that frame into the poster through the same sharp code a photo
 * takes, and only then is the item ready. Either way the manifest is
 * rebuilt and the site reads it at runtime, so nothing needs a deploy.
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

    /**
     * The transcoder's identity. MediaConvert is not a Lambda: it reads the
     * original and writes its outputs as itself, so it needs its own role
     * with its own access to the media bucket.
     */
    const transcodeRole = new aws.iam.Role("TranscodeRole", {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "mediaconvert.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });
    new aws.iam.RolePolicy("TranscodeRolePolicy", {
      role: transcodeRole.id,
      policy: $resolve([media.arn]).apply(([bucketArn]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["s3:GetObject"],
              Resource: `${bucketArn}/originals/*`,
            },
            {
              Effect: "Allow",
              // Where the renditions and the captured frames go, and nowhere
              // else: the transcoder can never touch items/ or the manifest.
              Action: ["s3:PutObject"],
              Resource: [`${bucketArn}/renditions/*`, `${bucketArn}/frames/*`],
            },
          ],
        }),
      ),
    });

    /**
     * Uploads fan out to one of two handlers by extension.
     *
     * S3 allows several notification configurations on one bucket as long as
     * their filters don't overlap, and a prefix plus a suffix is one filter —
     * hence one configuration per extension rather than one per handler.
     * Anything else dropped into `originals/` matches nothing and is ignored,
     * which is the behaviour we want for a stray file.
     *
     * sharp is a native module, so it is installed into the bundle rather
     * than bundled by esbuild. 2 GB is about CPU, not memory: Lambda scales
     * CPU with memory, and a 20-megapixel JPEG resized four ways is a few
     * seconds at this size.
     */
    const processImage = {
      handler: "packages/functions/src/process-image.handler",
      architecture: "arm64" as const,
      memory: "2048 MB" as const,
      timeout: "2 minutes" as const,
      link: [media],
      environment: { MEDIA_BUCKET: media.name },
      nodejs: { install: ["sharp"] },
    };

    /**
     * This one only hands the file to MediaConvert — it never reads a byte of
     * it — so it is small and quick regardless of how long the clip is.
     */
    const processVideo = {
      handler: "packages/functions/src/process-video.handler",
      architecture: "arm64" as const,
      memory: "512 MB" as const,
      timeout: "30 seconds" as const,
      link: [media],
      environment: {
        MEDIA_BUCKET: media.name,
        MEDIACONVERT_ROLE_ARN: transcodeRole.arn,
        STAGE: $app.stage,
      },
      permissions: [
        {
          actions: ["mediaconvert:CreateJob"],
          resources: ["*"],
        },
        // Handing a role to MediaConvert is itself a permission.
        { actions: ["iam:PassRole"], resources: [transcodeRole.arn] },
      ],
    };

    media.notify({
      notifications: [
        ...["jpg", "jpeg", "png", "webp"].map((ext) => ({
          name: `ProcessImage${ext}`,
          events: ["s3:ObjectCreated:*"] as const,
          filterPrefix: "originals/",
          filterSuffix: `.${ext}`,
          function: processImage,
        })),
        ...["mp4", "mov"].map((ext) => ({
          name: `ProcessVideo${ext}`,
          events: ["s3:ObjectCreated:*"] as const,
          filterPrefix: "originals/",
          filterSuffix: `.${ext}`,
          function: processVideo,
        })),
      ],
    });

    /**
     * A transcode finishes minutes after the upload did, on MediaConvert's
     * clock rather than ours, so the only way to hear about it is to listen.
     * This is the second half of `process-video`: it captures the poster
     * through the same sharp pipeline a photo takes, fills in the item and
     * rebuilds the manifest.
     */
    const videoComplete = new sst.aws.Function("VideoComplete", {
      handler: "packages/functions/src/video-complete.handler",
      architecture: "arm64",
      memory: "2048 MB",
      timeout: "2 minutes",
      link: [media],
      environment: { MEDIA_BUCKET: media.name },
      nodejs: { install: ["sharp"] },
    });
    const jobStateRule = new aws.cloudwatch.EventRule("VideoJobState", {
      eventPattern: JSON.stringify({
        source: ["aws.mediaconvert"],
        "detail-type": ["MediaConvert Job State Change"],
        detail: {
          // PROGRESSING and STATUS_UPDATE fire constantly and say nothing the
          // handler acts on; filtering here keeps them out of the bill.
          status: ["COMPLETE", "ERROR", "CANCELED"],
          // Job state changes are account-wide, so without this every stage
          // in the account would wake for every other stage's transcodes.
          userMetadata: { stage: [$app.stage] },
        },
      }),
    });
    new aws.cloudwatch.EventTarget("VideoJobStateTarget", {
      rule: jobStateRule.name,
      arn: videoComplete.arn,
    });
    new aws.lambda.Permission("VideoJobStateInvoke", {
      action: "lambda:InvokeFunction",
      function: videoComplete.name,
      principal: "events.amazonaws.com",
      sourceArn: jobStateRule.arn,
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
