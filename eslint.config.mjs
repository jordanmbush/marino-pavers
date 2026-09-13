import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier/flat";

/**
 * Architecture enforced by lint, not by convention.
 *
 * The layers, and what plays each MVC role:
 *
 *   packages/domain/          MODEL. The photo library as plain data: item and
 *                             manifest schemas, rendition math, sort order, the
 *                             admin API contract. Pure functions, no framework,
 *                             no AWS — the same code runs in a Lambda, a build,
 *                             a browser and a unit test.
 *   packages/functions/       SERVER CONTROLLERS. The two Lambdas: the image
 *                             processor and the admin API. The only code that
 *                             may touch S3, sharp or Cognito verification.
 *   apps/web/src/services/    CLIENT CONTROLLERS. Content reads, the manifest
 *                             fetch, admin API calls, the Cognito session. The
 *                             only layer in the app that fetches or touches
 *                             browser storage. Framework-agnostic.
 *   apps/web/src/content/     CONTENT. Zod-validated collections (services,
 *                             process, FAQs). Read through the content
 *                             service, never straight from a view.
 *   apps/web/src/pages/       VIEW. Astro pages (static HTML) and React
 *   apps/web/src/layouts/     islands. Calls services; renders what it gets.
 *   apps/web/src/components/
 *   apps/web/src/components/ui/   The primitive kit. Domain-free, prop-driven.
 *
 * ── The flat-config clobbering hazard ────────────────────────────────────────
 * Flat config REPLACES same-rule options across matching blocks rather than
 * merging them. Two blocks naming `no-restricted-imports` over overlapping file
 * sets means the later one silently wins and the earlier one is dead. So rule
 * ids are allocated deliberately:
 *
 *   `@typescript-eslint/no-restricted-imports`  layer boundaries A–E, whose
 *                                               file sets are DISJOINT.
 *   `no-restricted-imports` (base)              the server-package ban (F),
 *                                               which spans everything.
 *   `no-restricted-globals`                     the view-layer fetch/storage
 *                                               ban (G) — one block.
 *   `no-restricted-syntax`                      the native-controls ban only.
 *   `local/*`                                   anything else needing its own
 *                                               severity or file scope (the
 *                                               island copy ban, H).
 *
 * `eslint.config.test.mjs` lints synthetic snippets at synthetic paths and
 * asserts which rule ids fire, so a boundary that stops reporting fails a
 * test instead of looking like a clean codebase.
 */

// No view-layer module may exceed 300 lines, counted without blanks and
// comments so documenting a module never counts against it. Over the number,
// split the module — there is no allowlist.
const MAX_COMPONENT_LINES = 300;

const FRAMEWORK_BAN =
  "This layer must stay framework-agnostic so the same code can run in a Lambda, a build step, a test and the browser. Don't import React or Astro here — return plain data and let the view render it.";

const DOMAIN_IS_BOTTOM =
  "The domain is the bottom of the stack. Dependency direction is view → services → domain (and functions → domain), never the reverse. If the domain needs a capability, take it as a parameter.";

const NO_APP_IMPORTS =
  "Packages must not import from the web app — the dependency direction is apps/* → packages/*, never the reverse. Move shared code into @marino/domain.";

const NO_VIEW_IMPORTS =
  "Services must not import the view layer. Return data; let the component decide how to render it.";

const CONTENT_BAN =
  "Views read content through the content service (@/services/content), not astro:content directly. One place owns the collection queries and their sort order.";

const NETWORK_BAN =
  "Views don't fetch and don't touch browser storage. Call a service in apps/web/src/services/ — that layer owns URLs, auth headers, error mapping and the session, so they can change once.";

const SERVER_PACKAGE_BAN =
  "The AWS SDK, sharp and JWT verification are server-side implementation details of packages/functions/. Nothing in the app or the domain may import them — the browser must never bundle them and the domain must stay pure.";

const COPY_BAN =
  "Views read copy through i18n() in @/services/i18n, which picks the page's language. Importing a dictionary directly hardcodes one language — and from an island it would ship every dictionary to the browser. (A type-only import is fine.)";

const ISLAND_I18N_BAN =
  "React islands must not import @/services/i18n: it binds every dictionary, and an island's imports are bundled for the browser. Take the copy slice as a prop from the .astro parent and use fill() from @/services/locale.";

const KIT_BAN =
  "UI primitives (components/ui/) must be domain-free and prop-driven. Don't import domain values, services or content — pass data and callbacks in as props. (A type-only import of a contract the primitive implements is fine.)";

/**
 * Local rules, defined once and registered in a single global block. A plugin
 * namespace may be declared only once per file, and these rules apply to
 * overlapping file sets, so declaring `plugins: { local }` per block would
 * throw `Cannot redefine plugin "local"` for exactly the files in the overlap.
 */
const localPlugin = {
  rules: {
    // `window.localStorage` is a member expression, invisible to
    // `no-restricted-globals`, which only sees the bare identifier.
    "no-window-storage": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Ban window.localStorage/sessionStorage/indexedDB outside services.",
        },
        schema: [],
        messages: { banned: NETWORK_BAN },
      },
      create(context) {
        return {
          "MemberExpression[object.name='window'][property.name=/^(localStorage|sessionStorage|indexedDB)$/]"(
            node,
          ) {
            context.report({ node, messageId: "banned" });
          },
        };
      },
    },
    // `no-restricted-imports` ids are all spoken for over .tsx files (D and
    // F), so the island ban gets its own id rather than a clobbering block.
    "no-island-i18n": {
      meta: {
        type: "problem",
        docs: {
          description: "Ban @/services/i18n in React islands (.tsx).",
        },
        schema: [],
        messages: { banned: ISLAND_I18N_BAN },
      },
      create(context) {
        return {
          "ImportDeclaration[source.value='@/services/i18n']"(node) {
            context.report({ node, messageId: "banned" });
          },
        };
      },
    },
    // Companion to the native-controls ban: role="button" on a non-button
    // hand-rolls focus, Enter/Space activation and disabled handling that a
    // real control gives for free.
    "prefer-button-component": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            'Prefer the <Button> primitive over a hand-rolled role="button".',
        },
        schema: [],
        messages: {
          preferButton:
            'Avoid role="button" on a non-button element — it hand-rolls button semantics. Use the <Button> primitive.',
        },
      },
      create(context) {
        return {
          "JSXAttribute[name.name='role'][value.value='button']"(node) {
            context.report({ node, messageId: "preferButton" });
          },
        };
      },
    },
  },
};

const REACT = ["react", "react-dom", "react/*", "react-dom/*"];
const ASTRO = ["astro", "astro:*", "@astrojs/*"];
const SERVER_PACKAGES = ["@aws-sdk/*", "sharp", "aws-jwt-verify"];

export default defineConfig([
  { plugins: { local: localPlugin } },

  globalIgnores([
    "**/dist/**",
    "**/.astro/**",
    ".sst/**",
    "**/coverage/**",
    "**/node_modules/**",
    // Generated by `sst dev`/`sst deploy`; not ours to lint.
    "**/sst-env.d.ts",
  ]),

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],

  // React island rules. Registered explicitly rather than via a preset so the
  // plugin's flat-config export shape can't shift under a minor bump.
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // ── A · MODEL boundary ──────────────────────────────────────────────────────
  {
    files: ["packages/domain/**/*.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: [...REACT, ...ASTRO], message: FRAMEWORK_BAN },
            {
              group: [
                ...SERVER_PACKAGES,
                "sst",
                "@marino/functions",
                "@marino/functions/*",
                "@marino/web",
                "@marino/web/*",
                "@/*",
                "@/**",
              ],
              message: DOMAIN_IS_BOTTOM,
            },
          ],
        },
      ],
    },
  },

  // ── B · SERVER CONTROLLER boundary ──────────────────────────────────────────
  {
    files: ["packages/functions/**/*.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: [...REACT, ...ASTRO], message: FRAMEWORK_BAN },
            {
              group: [
                "@marino/web",
                "@marino/web/*",
                "@/*",
                "@/**",
                "**/apps/web",
                "**/apps/web/**",
              ],
              message: NO_APP_IMPORTS,
            },
          ],
        },
      ],
    },
  },

  // ── C · CLIENT CONTROLLER boundary ──────────────────────────────────────────
  {
    files: ["apps/web/src/services/**/*.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: REACT, message: FRAMEWORK_BAN },
            {
              group: [
                "@/components",
                "@/components/*",
                "@/pages",
                "@/pages/*",
                "@/layouts",
                "@/layouts/*",
              ],
              message: NO_VIEW_IMPORTS,
            },
          ],
        },
      ],
    },
  },

  // ── D · VIEW boundary ───────────────────────────────────────────────────────
  // `ignores` the kit on purpose: block E names the same rule id over
  // components/ui/**, and without this ignore E would clobber D there.
  {
    files: [
      "apps/web/src/pages/**/*.{ts,tsx,astro}",
      "apps/web/src/layouts/**/*.{ts,tsx,astro}",
      "apps/web/src/components/**/*.{ts,tsx,astro}",
    ],
    ignores: ["apps/web/src/components/ui/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["astro:content"], message: CONTENT_BAN },
            {
              group: ["@/content/copy", "@/content/copy/*"],
              allowTypeImports: true,
              message: COPY_BAN,
            },
            {
              group: ["@marino/functions", "@marino/functions/*"],
              message: NO_APP_IMPORTS,
            },
          ],
        },
      ],
    },
  },

  // ── E · KIT boundary ────────────────────────────────────────────────────────
  {
    files: ["apps/web/src/components/ui/**/*.{ts,tsx,astro}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@marino/domain", "@marino/domain/*"],
              allowTypeImports: true,
              message: KIT_BAN,
            },
            {
              group: ["@/content", "@/content/*"],
              allowTypeImports: true,
              message: KIT_BAN,
            },
            {
              group: ["@/services", "@/services/*", "astro:content"],
              message: KIT_BAN,
            },
          ],
        },
      ],
    },
  },

  // ── F · Server packages stay in packages/functions ──────────────────────────
  // Uses the BASE rule id so it doesn't collide with the layer blocks above.
  {
    files: ["**/*.{ts,tsx,mts,astro}"],
    ignores: ["packages/functions/**", "sst.config.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: SERVER_PACKAGES, message: SERVER_PACKAGE_BAN }] },
      ],
    },
  },

  // ── G · Views don't fetch, and don't touch storage ──────────────────────────
  // Covers the kit as well as the feature views: a primitive that fetched would
  // be exactly as wrong as a page that did.
  {
    files: [
      "apps/web/src/pages/**/*.{ts,tsx,astro}",
      "apps/web/src/layouts/**/*.{ts,tsx,astro}",
      "apps/web/src/components/**/*.{ts,tsx,astro}",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: NETWORK_BAN },
        { name: "localStorage", message: NETWORK_BAN },
        { name: "sessionStorage", message: NETWORK_BAN },
        { name: "indexedDB", message: NETWORK_BAN },
      ],
      "local/no-window-storage": "error",
    },
  },

  // ── H · Islands take copy as props ──────────────────────────────────────────
  // Everything a .tsx file imports is bundled for the browser. The static
  // .astro parent resolves the language and hands the island its slice.
  {
    files: ["apps/web/src/**/*.tsx"],
    rules: { "local/no-island-i18n": "error" },
  },

  // ── Design-system boundary ──────────────────────────────────────────────────
  // Feature code composes the kit; it doesn't hand-roll native controls, which
  // drift away from the shared focus rings, hit targets and tone.
  {
    files: ["**/*.tsx"],
    ignores: ["apps/web/src/components/ui/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.name=/^(button|input|select|textarea|label)$/]",
          message:
            "Don't hand-roll native controls outside components/ui/. Use the kit: <button>→<Button>, <input>→<Input>/<FileInput>/<Checkbox>, <select>→<Select>, <label>→<Field>. If the kit is missing a primitive, add it there.",
        },
      ],
      "local/prefer-button-component": "error",
    },
  },

  // ── Component size cap ──────────────────────────────────────────────────────
  {
    files: ["apps/web/src/components/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "max-lines": [
        "error",
        { max: MAX_COMPONENT_LINES, skipBlankLines: true, skipComments: true },
      ],
    },
  },

  // Node-context files: configs, scripts, the Lambdas, the boundary suite.
  {
    files: [
      "*.config.{js,mjs,ts}",
      "*.config.test.mjs",
      "**/vitest.config.ts",
      "apps/web/astro.config.ts",
      "scripts/**/*.{js,mjs,ts}",
      "infra/**/*.ts",
      "packages/functions/**/*.ts",
      "sst.config.ts",
    ],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        crypto: "readonly",
      },
    },
    rules: {
      "no-restricted-globals": "off",
    },
  },

  {
    // SST loads its platform types through a triple-slash reference.
    files: ["sst.config.ts"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },

  // Prettier last so it wins over any stylistic rule above.
  prettier,
]);
