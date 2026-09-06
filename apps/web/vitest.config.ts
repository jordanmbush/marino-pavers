import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Runs in plain Node: services and the kit are exercised as ordinary
 * functions (React components through `renderToStaticMarkup`), so no DOM
 * environment is needed. The `@/` alias is restated here because Vitest
 * reads neither tsconfig `paths` nor Astro's config.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    name: "web",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
