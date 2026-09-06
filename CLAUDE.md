# Marino Pavers — marinopavers.com

Marketing site for a Phoenix paver, turf and outdoor-living contractor, built as
a **static site** with one dynamic thing: the client manages the project photos
themselves, and a new photo shows on the site without a deploy.

## The constraints everything follows from

1. **Static.** `astro build` writes HTML to disk; S3 + CloudFront serve it.
   There is no origin server. The two Lambdas exist only for photos.
2. **The client owns the photos.** They upload from `/admin`; a Lambda makes
   the renditions and rebuilds `manifest.json`; the gallery reads that manifest
   at runtime. Nothing about a photo requires a rebuild.
3. **SEO is a first-class requirement.** Every public page is real prerendered
   HTML with a title, description, canonical and LocalBusiness JSON-LD
   (`src/layouts/Base.astro`). Islands add behaviour; they never replace content.
4. **No forms, no user input.** Contact is phone and email links.

## Architecture — enforced by lint, not by convention

`eslint.config.mjs` is the spec; read its header before adding a boundary.
`eslint.config.test.mjs` proves each boundary fires. The short version:

| Layer            | Directory                                  | May import                       | Must not                                  |
| ---------------- | ------------------------------------------ | -------------------------------- | ----------------------------------------- |
| **Model**        | `packages/domain/`                         | zod                              | React, Astro, AWS SDK, sharp, the app     |
| **Server ctrl.** | `packages/functions/`                      | domain, AWS SDK, sharp           | React, Astro, the app                     |
| **Client ctrl.** | `apps/web/src/services/`                   | domain, `astro:content`, `fetch` | React, the view layer                     |
| **Content**      | `apps/web/src/content/`                    | —                                | read only via `@/services/content`        |
| **View**         | `apps/web/src/{pages,layouts,components}/` | services, domain, content        | `astro:content`, `fetch`, browser storage |
| **Kit**          | `apps/web/src/components/ui/`              | nothing domain-shaped (types ok) | domain values, services, `fetch`          |

Two rules people trip over:

- **Views never fetch and never touch storage.** Call a service. URLs, auth
  headers, error mapping and the session live in one place.
- **Never hand-roll `<button>` / `<input>` / `<select>` / `<label>` in a `.tsx`
  outside `components/ui/`.** Use the kit; if it lacks a primitive, add one.

View modules cap at **300 lines**, counted without blanks and comments. Over
the cap, split the module — there is no allowlist.

## Where things are

- `apps/web/` — the Astro site. `src/content/*.json` is the copy (services,
  FAQs, testimonials…), validated by `src/content.config.ts`; `src/content/site.ts`
  is the business facts and nav. ⚠️ Phone, email, license, socials and stats
  there are **placeholders** until the client supplies real ones.
- `packages/domain/` — the photo library as data: item and manifest schemas,
  bucket key layout, rendition math, sort order, the admin API contract.
- `packages/functions/` — `process-image` (S3 event → sharp → renditions +
  manifest) and `admin-api` (Function URL, Cognito-verified).
- `sst.config.ts` — all infrastructure. One CloudFront Router serves `/` (site
  bucket), `/media/*` (photo bucket: renditions + manifest only) and `/api/*`
  (admin Lambda).

## Photo pipeline

```
/admin  →  POST /api/admin/uploads  →  presigned PUT to originals/{id}.jpg
        ←  pending item written to items/{id}.json
S3 event →  process-image: renditions/{id}/{480,960,1440,2048}.webp
                           + placeholder, dims  →  item ready  →  manifest.json
site     →  GET /media/manifest.json (60 s cache)  →  <img srcset sizes>
```

Cognito user pool, admin-created users only (`scripts/create-admin.sh`). The
admin page signs in with `USER_PASSWORD_AUTH` over plain fetch — no AWS SDK in
the browser.

## Validation

```bash
npm run type-check   # astro check + tsc, every workspace
npm run lint         # the boundaries above
npm run test         # domain, functions, web, and the lint-config suite
npm run build        # must stay static
```

CI runs all of these on every push and PR. Husky runs lint-staged pre-commit
and the full set pre-push.

## Infrastructure

SST v4 → S3 + CloudFront + Lambda + Cognito in AWS account `652346859306`
(`marino-pavers` SSO profile, `us-west-1`). DNS is Cloudflare-authoritative;
SST's Cloudflare adapter writes the records on the production stage only.
`npm run deploy:dev` needs nothing but the SSO login; production needs
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_DEFAULT_ACCOUNT_ID`.
GitHub Actions deploys `main` via OIDC (`scripts/setup-github-oidc.sh`).

Local dev against a deployed dev stage: copy `apps/web/.env.example` to
`apps/web/.env` with the dev outputs, `npm run dev`, and `npm run tunnel` to
show it to the client at `https://dev.marinopavers.com`.

## Gotchas

- **Astro 7's compiler is strict**: unclosed tags are errors, and whitespace
  between inline elements follows JSX rules — use `{" "}` where a space matters.
- **`as` is not a safe prop name in `.astro` files**: the compiler loses the
  `Props` type. `Reveal` uses `tag`.
- **Filenames must differ by more than case.** `Button.tsx` and `button.ts`
  resolve to the same module on macOS; hence `button-classes.ts`.
- **Lucide dropped brand icons**; Instagram and Facebook are inline SVGs in
  `Footer.astro`.
- **`fileOptions` in `sst.config.ts` replaces SST's defaults** — keep the `**`
  catch-all first or files silently stop uploading.
- **Unknown URLs answer 404 only because CloudFront has `s3:ListBucket`** on
  the site bucket (`transform.assets` in `sst.config.ts`); without it S3 says 403. The body is S3's XML, not `404.html` — serving the branded page under
  the Router is a follow-up (`/404.html` itself is reachable).
- **TypeScript stays on 6.0.x.** TS 7 ships no JS API yet; typescript-eslint and
  `astro check` can't run on it.
