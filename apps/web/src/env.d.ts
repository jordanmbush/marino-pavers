/// <reference types="astro/client" />

/**
 * Public env the site reads. All set by sst.config.ts for a deployed build;
 * for local dev copy `.env.example` to `.env` and point them at a dev stage.
 * PUBLIC_ so Astro inlines them into client code as well as the build.
 */
interface ImportMetaEnv {
  /** Absolute base URL for renditions and manifest.json, e.g. https://…/media. Defaults to /media. */
  readonly PUBLIC_MEDIA_URL?: string;
  /** Base URL of the admin API. Empty means same origin. */
  readonly PUBLIC_API_URL?: string;
  readonly PUBLIC_COGNITO_CLIENT_ID?: string;
  readonly PUBLIC_AWS_REGION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Plain `tsc` (the second half of `type-check`) can't read `.astro` files;
 * `astro check` can. Tests import `.astro` components to render them through
 * the Container API, so give tsc a shape for those imports.
 */
declare module "*.astro" {
  import type { AstroComponentFactory } from "astro/runtime/server/index.js";
  const component: AstroComponentFactory;
  export default component;
}
