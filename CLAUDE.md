# Marino Pavers — marinopavers.com

Marketing site for a Phoenix paver, turf and outdoor-living contractor, built as
a **static site** with one dynamic thing: the client manages the project photos
and videos themselves, and a new one shows on the site without a deploy.

## The constraints everything follows from

1. **Static.** `astro build` writes HTML to disk; S3 + CloudFront serve it.
   There is no origin server. The Lambdas exist only for the media library.
2. **The client owns the library.** They upload from `/admin`; a Lambda makes
   the renditions (or hands a video to MediaConvert) and rebuilds
   `manifest.json`; the gallery reads that manifest at runtime. Nothing about
   a photo or a clip requires a rebuild.
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
  process, FAQs), validated by `src/content.config.ts`; `src/content/copy/`
  is every other sentence on the site, one dictionary per language;
  `src/content/site.ts` is the business facts and nav routes. Facebook has no
  link yet, so `socials` lists Instagram only.
- `apps/web/src/assets/photos/` — the seven photos the static pages use: the
  home hero and one per service, named by service id. They are the client's
  own, pulled from the production library and resized to fit 2048px;
  `photos/README.md` says which library photo each is and how to swap one.
  Astro crops and resizes them at build (`<Image fit="cover">`), so the
  pages never depend on the manifest or on a photo surviving the admin.
- `packages/domain/` — the media library as data: item and manifest schemas,
  bucket key layout, rendition math, sort order, the admin API contract. An
  item's `kind` is `photo` or `video`; both carry an `image` (a video's is its
  poster), and a video also carries the MP4 renditions it was transcoded to.
- `packages/functions/` — `process-image` (S3 event → sharp → renditions +
  manifest), `process-video` (S3 event → a MediaConvert job), `video-complete`
  (EventBridge → poster + renditions + manifest) and `admin-api` (Function
  URL, Cognito-verified).
- `sst.config.ts` — all infrastructure. One CloudFront Router serves `/` (site
  bucket), `/media/*` (media bucket: renditions + manifest only) and `/api/*`
  (admin Lambda).
- `infra/redirects.ts` — the CloudFront Function code the Router runs before
  routing: retired URLs (`/about`, `/contact` → `/`, `/our-work` → `/gallery`)
  answer 301 at the edge. Its test executes the code, because a syntax error
  there takes the whole distribution down. Retire a page → add a row.
- `scripts/verify-build.sh` — what a correct `dist/` looks like: static, every
  page in every language, canonical + hreflang, sitemap without `/admin`, no
  dictionary in the browser bundle. CI runs it after the build.
- The gallery page emits `VideoObject` structured data for the clips that
  existed at build time (`videoListJsonLd` in `services/media.ts`). Only what
  was prerendered is described: a clip uploaded since the last deploy plays
  for a reader but is not claimed to a crawler.

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

## Media pipeline

Both kinds take the same first step and the same last one. Which processor
runs in between is decided by the uploaded file's extension, in the S3
notification filters — not in any handler.

```
/admin  →  POST /api/admin/uploads  →  presigned PUT to originals/{id}.{ext}
        ←  pending item written to items/{id}.json

 photo   S3 event →  process-image: renditions/{id}/r{rot}/{480,960,1440,2048}.webp
                                    + placeholder, dims  →  ready  →  manifest.json

 video   S3 event →  process-video: submits a MediaConvert job, records jobId,
                                    stays pending (never reads the file)
         MediaConvert → renditions/{id}/r{rot}/v{480,1080}.mp4
                      → frames/{id}/r{rot}/frame.*.jpg
         EventBridge → video-complete: last frame → the same sharp code a photo
                                    takes → the same .webp renditions → ready
                                    → manifest.json, frames swept

site     →  GET /media/manifest.json (60 s cache)  →  <img srcset> / <video>
```

**A video's poster is a photo.** The captured frame goes through the same
`processImage` and lands under the same rendition keys, so `item.image` means
one thing for both kinds. That is why the grid, the lightbox, the admin
thumbnail, every `srcset` and every blur placeholder have no video branch —
only `MediaCard` and `LightboxMedia` choose between an `<img>` and a
`<video>`, and `isReady` refuses to publish a video missing either half.

**Video renditions are picked by where they are going, not by bandwidth** —
`<video>` has no `srcset`. The grid plays 480p (every tile at once, muted,
looping, paused the moment it leaves the viewport) and the lightbox plays
1080p with the browser's own controls. `VIDEO_SIZES` names the two.

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

SST v4 → S3 + CloudFront + Lambda + Cognito + MediaConvert in AWS account
`652346859306`
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
show it to the client at `https://dev.marinopavers.com`. Cloudflare proxies
that hostname and caches by file extension, replacing Vite's `no-cache` with
a four-hour browser TTL, which once left a browser painting a stale
stylesheet module over fresh markup. The dev server therefore sends
`Cache-Control: no-store` (`vite.server.headers` in `astro.config.ts`);
a tab opened before that change needs one hard refresh.

## Gotchas

- **Astro 7's compiler is strict**: unclosed tags are errors, and whitespace
  between inline elements follows JSX rules — use `{" "}` where a space matters.
- **`as` is not a safe prop name in `.astro` files**: the compiler loses the
  `Props` type. Call such a prop `tag`.
- **Filenames must differ by more than case.** `Button.tsx` and `button.ts`
  resolve to the same module on macOS; hence `button-classes.ts`.
- **Lucide dropped brand icons**; Instagram and Facebook are drawn by hand in
  `components/site/SocialIcon.astro`, in their own brand colours.
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
- **S3 refuses overlapping notification filters**, which is why the split
  between the two processors is one configuration per extension
  (`originals/` + `.jpg`, `originals/` + `.mp4`, …) rather than one per
  handler. A shared prefix is allowed _as long as the suffixes don't
  overlap_, and two suffixes overlap when some string could end with both —
  so `.jpg` and `.jpeg` are fine, but `.jpg` and `jpg` would not be. Adding a
  format means a row in `sst.config.ts` and a row in that handler's
  `EXTENSION_TYPES`; a file matching no filter is silently ignored, which is
  the right answer for a stray upload and a baffling one when you forgot the
  row.
- **MediaConvert's `Rotate` can't compose with the camera's.** A phone writes
  orientation into the container, and MediaConvert ignores it unless `Rotate`
  is `AUTO` — so rotation 0 means AUTO, and a client-chosen angle _replaces_
  it rather than adding to it (`rotateFor` in `lib/transcode.ts`). That is
  only correct because the client reaches for those buttons exactly when AUTO
  got it wrong, i.e. when there was no usable metadata to compose with.
- **The poster frame is rendered at rotation 0.** The turning already
  happened in the transcode, so `processImage(frame, 0)` — passing the item's
  rotation there would turn it twice. The item's rotation still _names_ the
  key, which is what stops a year-long cache serving the old orientation.
- **Captured frames live outside `renditions/`.** The Router publishes that
  prefix; `frames/{id}/…` is scaffolding, read once to build the poster and
  deleted in the same breath. Anything written under `renditions/` is public
  the moment it lands.
- **MediaConvert's outputs arrive unlabelled.** They are written by
  MediaConvert, not by `putObject`, so they carry neither the year-long
  `Cache-Control` the rest of `renditions/` is served with nor a content type
  you can rely on — and an `.mp4` served as `binary/octet-stream` is a video
  that silently will not play. `video-complete` fixes both with a self-copy
  (`setObjectHeaders`) before publishing, which is server-side: no bytes pass
  through the Lambda. If that copy fails the item fails; it is not worth
  publishing a video nobody can watch.
- **A transcode can finish for a job nobody is waiting on.** Rotating twice
  in quick succession puts two jobs in flight; `video-complete` writes only
  when `item.jobId` matches the event's, or the loser would overwrite the
  winner's record minutes later.
- **React is unreliable about `muted` across hydration**, and no browser
  autoplays an unmuted video. Both call sites pass `muted` _and_
  `useMutedAutoplay` sets `video.muted` imperatively on mount; dropping
  either one gives you a grid of frozen posters on some browsers and not
  others.
