/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { getViteConfig } from "astro/config";

/**
 * Vitest runs on Astro's own Vite config, so a test can render `.astro`
 * components through the Container API as well as call services and React
 * components as plain functions. No DOM environment: React components go
 * through `renderToStaticMarkup`, Astro ones through `renderToString`.
 *
 * `root` is passed twice on purpose: Vite's for the test project, Astro's to
 * find `astro.config.ts` when the suite is launched from the repo root.
 * `.env.test` is loaded over `.env`, so a developer's dev-stage URLs never
 * reach a test.
 */
const root = fileURLToPath(new URL(".", import.meta.url));

export default getViteConfig(
  {
    root,
    test: {
      name: "web",
      include: ["src/**/*.test.{ts,tsx}"],
    },
  },
  { root },
);
