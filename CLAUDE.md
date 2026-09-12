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

| Layer            | Directory                                  | May import                       | Must not                                                           |
| ---------------- | ------------------------------------------ | -------------------------------- | ------------------------------------------------------------------ |
| **Model**        | `packages/domain/`                         | zod                              | React, Astro, AWS SDK, sharp, the app                              |
| **Server ctrl.** | `packages/functions/`                      | domain, AWS SDK, sharp           | React, Astro, the app                                              |
| **Client ctrl.** | `apps/web/src/services/`                   | domain, `astro:content`, `fetch` | React, the view layer                                              |
| **Content**      | `apps/web/src/content/`                    | —                                | read only via `@/services/content`                                 |
| **View**         | `apps/web/src/{pages,layouts,components}/` | services, domain, content        | `astro:content`, `fetch`, browser storage, `@/content/copy` values |
| **Islands**      | `apps/web/src/**/*.tsx`                    | as View, copy arrives as a prop  | `@/services/i18n` (bundles every dictionary)                       |
| **Kit**          | `apps/web/src/components/ui/`              | nothing domain-shaped (types ok) | domain values, services, `fetch`                                   |

Two rules people trip over:

- **Views never fetch and never touch storage.** Call a service. URLs, auth
  headers, error mapping and the session live in one place.
- **Never hand-roll `<button>` / `<input>` / `<select>` / `<label>` in a `.tsx`
  outside `components/ui/`.** Use the kit; if it lacks a primitive, add one.

View modules cap at **300 lines**, counted without blanks and comments. Over
the cap, split the module — there is no allowlist.

## Where things are

- `apps/web/` — the Astro site. `src/content/*.json` is the copy (services,
  FAQs, testimonials…), validated by `src/content.config.ts`; `src/content/copy/`
  is every other sentence on the site, one dictionary per language;
  `src/content/site.ts` is the business facts and nav routes. ⚠️ The project count and
  the Scottsdale address there are **placeholders**; Facebook has no link yet,
  so `socials` lists Instagram only.
- `packages/domain/` — the photo library as data: item and manifest schemas,
  bucket key layout, rendition math, sort order, the admin API contract.
- `packages/functions/` — `process-image` (S3 event → sharp → renditions +
  manifest) and `admin-api` (Function URL, Cognito-verified).
- `sst.config.ts` — all infrastructure. One CloudFront Router serves `/` (site
  bucket), `/media/*` (photo bucket: renditions + manifest only) and `/api/*`
  (admin Lambda).
- `infra/redirects.ts` — the CloudFront Function code the Router runs before
  routing: retired URLs (`/about`, `/contact` → `/`, `/our-work` → `/gallery`)
  answer 301 at the edge. Its test executes the code, because a syntax error
  there takes the whole distribution down. Retire a page → add a row.
- `scripts/verify-build.sh` — what a correct `dist/` looks like: static, every
  page in every language, canonical + hreflang, sitemap without `/admin`, no
  dictionary in the browser bundle. CI runs it after the build.

## Languages

English at the root, Spanish under `/es/` — real prerendered pages, not a
client-side swap, so each has its own `lang`, title, canonical and hreflang
and the sitemap lists both. How it fits together:

- `src/content/locales.ts` names the locales; `astro.config.ts` declares them
  to Astro (`prefixDefaultLocale: false`) and to the sitemap.
- Public pages live once in `src/pages/[...locale]/` and prerender per locale
  via `localeParams()`. Components read `Astro.currentLocale` through
  `i18n()` in `src/services/i18n.ts`, which returns `{ locale, t, href }`:
  the dictionary and a link builder that adds the prefix. Never hardcode
  `/es/` in a view.
- `src/content/copy/en.ts` is the shape; `es.ts` is typed against it, so a
  string without a translation is a compile error. The content JSON carries
  sibling `en` / `es` blocks per entry (schema `localized()`), and the
  content service flattens an entry to one language.
- The dictionary is plain data with `{slot}` templates (`fill()` in
  `src/services/locale.ts`) because the gallery island receives its slice as
  a prop and Astro serializes island props. Lint enforces the split: views
  never value-import `@/content/copy` (use `i18n()`), and `.tsx` never
  imports `@/services/i18n`, so no dictionary ships to the browser.
- `src/content/copy/copy.test.ts` checks what types can't: both dictionaries
  have the same strings and the same `{slots}`, nothing is blank, and titles
  and meta descriptions fit what search results show (70 / 160 chars).
- `404.html` carries every language and a script shows the one the URL asked
  for, ready for when CloudFront can serve it — today a missing URL under the
  Router answers S3's XML with status 404 (see Gotchas). `/admin` is English
  only; it is the client's tool.
- The language switcher is plain links to the page's alternates; a script
  carries `?category=` and `#anchor` across so a reader keeps their place.

## Photo pipeline

```
/admin  →  POST /api/admin/uploads  →  presigned PUT to originals/{id}.jpg
        ←  pending item written to items/{id}.json
S3 event →  process-image: renditions/{id}/r{rotation}/{480,960,1440,2048}.webp
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
npm run test         # domain, functions, web, infra, and the lint-config suite
npm run build        # must stay static
npm run verify:build # then prove it: pages, languages, sitemap, bundle
```

The web suite runs on Astro's own Vite config (`getViteConfig`), so `.astro`
components render in tests through the Container API — see
`src/components/site/site.test.ts`. Two things the container needs told:
the React renderer (`loadRenderers`) for any component with a Lucide icon,
and the i18n **manifest** (not `astroConfig.i18n`, which it ignores) or
`Astro.currentLocale` is always English.

CI runs all of these on every push and PR. Husky runs lint-staged pre-commit
and the full set pre-push.

⚠️ Don't run `type-check` or `build` while `astro dev --background` is up.
They share `apps/web/node_modules/.vite` and `.astro/` with the dev server:
the optimizer cache gets rewritten under it (islands then fail to hydrate
with "Failed to fetch dynamically imported module", a 504 on a `deps/*.js`
chunk) and a content-config change mid-edit can leave every collection
empty. Recover with `npx astro dev stop && npx astro dev --background` from
`apps/web`.

## Infrastructure

SST v4 → S3 + CloudFront + Lambda + Cognito in AWS account `652346859306`
(`marino-pavers` SSO profile, `us-west-1`). DNS is Cloudflare-authoritative;
SST's Cloudflare adapter writes the records on the production stage only.
`npm run deploy:dev` needs nothing but the SSO login; production needs
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_DEFAULT_ACCOUNT_ID`.
GitHub Actions deploys `main` via OIDC (`scripts/setup-github-oidc.sh`) and
smoke-checks every public page in both languages plus the legacy 301s.
The Router's `edge.viewerRequest.injection` is where those redirects live;
SST pastes it at the top of its CloudFront Function, so a `return` there
answers before any routing.

Local dev against a deployed dev stage: copy `apps/web/.env.example` to
`apps/web/.env` with the dev outputs, `npm run dev`, and `npm run tunnel` to
show it to the client at `https://dev.marinopavers.com`.

## Gotchas

- **Astro 7's compiler is strict**: unclosed tags are errors, and whitespace
  between inline elements follows JSX rules — use `{" "}` where a space matters.
- **`as` is not a safe prop name in `.astro` files**: the compiler loses the
  `Props` type. Call such a prop `tag`.
- **Filenames must differ by more than case.** `Button.tsx` and `button.ts`
  resolve to the same module on macOS; hence `button-classes.ts`.
- **Lucide dropped brand icons**; Instagram and Facebook are inline SVGs in
  `Footer.astro`.
- **`fileOptions` in `sst.config.ts` replaces SST's defaults** — keep the `**`
  catch-all first or files silently stop uploading.
- **Unknown URLs answer 404 only because CloudFront has `s3:ListBucket`** on
  the site bucket (`transform.assets` in `sst.config.ts`); without it S3 says 403. The body is S3's XML, not `404.html`: the Router's only configured
  origin is `placeholder.sst.dev` (the edge function swaps the real one in per
  request) and CloudFront fetches a `customErrorResponses` page from that
  static origin, so mapping 404 → `/404.html` on the Router turns every
  missing URL into a 502 (tried 2026-09-06). `/404.html` itself is reachable;
  serving it for misses needs a real default origin.
- **zod 4 applies `.default()` even under `.partial()` / `.optional()`.** A
  partial-update schema picked from a schema with defaults fills in `""` and
  `false` for every field the request left out, which is how a one-field
  save once wiped a photo's title. `editableItemSchema` is built from
  default-free fields for that reason; the stored schema adds the defaults.
- **React's `onLoad` misses images that finished loading before hydration.**
  Islands are prerendered, so an eager `<img>` can be complete before React
  attaches the listener; `PhotoCard` also checks `img.complete` on mount.
- **TypeScript stays on 6.0.x.** TS 7 ships no JS API yet; typescript-eslint and
  `astro check` can't run on it.
