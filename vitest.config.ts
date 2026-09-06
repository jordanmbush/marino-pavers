import { defineConfig } from "vitest/config";

/**
 * One `npm test` for the whole workspace. Each package keeps its own
 * vitest.config.ts (the web app needs the `@/` alias, the packages don't),
 * and the root project covers the repo-level suites — today that is the
 * ESLint boundary tests.
 */
export default defineConfig({
  test: {
    projects: [
      "apps/*",
      "packages/*",
      {
        test: {
          name: "root",
          include: ["*.test.mjs"],
        },
      },
    ],
  },
});
