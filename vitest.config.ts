import { defineConfig } from "vitest/config";

/**
 * One `npm test` for the whole workspace. Each package keeps its own
 * vitest.config.ts (the web app needs the `@/` alias, the packages don't),
 * and the root project covers the repo-level suites: the ESLint boundary
 * tests and the CloudFront edge code under `infra/`.
 */
export default defineConfig({
  test: {
    projects: [
      "apps/*",
      "packages/*",
      {
        test: {
          name: "root",
          include: ["*.test.mjs", "infra/**/*.test.ts"],
        },
      },
    ],
  },
});
