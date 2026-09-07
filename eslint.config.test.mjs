import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

/**
 * The architecture boundaries, tested like the code they guard.
 *
 * A flat config has two quiet ways to stop firing: a same-rule-id block over
 * an overlapping file set silently replaces an earlier one, and a plugin
 * namespace declared twice throws only for files matching both blocks. A rule
 * that has stopped reporting looks exactly like a codebase with no
 * violations, so nothing else would catch it.
 *
 * Each case lints a snippet AS IF it lived at a path in the layer under test,
 * and asserts on rule ids rather than message text.
 */

const eslint = new ESLint({ cwd: import.meta.dirname });

async function rulesFiredFor(filePath, code) {
  const [result] = await eslint.lintText(code, { filePath });
  const fatal = result.messages.find((message) => message.fatal);
  if (fatal) throw new Error(`${filePath} did not parse: ${fatal.message}`);
  return result.messages.map((message) => message.ruleId);
}

const LAYER = "@typescript-eslint/no-restricted-imports";
const PACKAGE = "no-restricted-imports";
const GLOBALS = "no-restricted-globals";
const SYNTAX = "no-restricted-syntax";
const ISLAND = "local/no-island-i18n";

describe("model layer (packages/domain/)", () => {
  it("bans React", async () => {
    const fired = await rulesFiredFor(
      "packages/domain/src/x.ts",
      'import { useState } from "react"; export const a = useState;',
    );
    expect(fired).toContain(LAYER);
  });

  it("bans the AWS SDK", async () => {
    const fired = await rulesFiredFor(
      "packages/domain/src/x.ts",
      'import { S3Client } from "@aws-sdk/client-s3"; export const a = S3Client;',
    );
    expect(fired).toContain(LAYER);
  });

  it("bans the web app", async () => {
    const fired = await rulesFiredFor(
      "packages/domain/src/x.ts",
      'import { a } from "@/services/media"; export { a };',
    );
    expect(fired).toContain(LAYER);
  });

  it("allows zod", async () => {
    const fired = await rulesFiredFor(
      "packages/domain/src/x.ts",
      'import { z } from "zod"; export const a = z.string();',
    );
    expect(fired).not.toContain(LAYER);
    expect(fired).not.toContain(PACKAGE);
  });
});

describe("server controllers (packages/functions/)", () => {
  it("allows sharp and the AWS SDK", async () => {
    const fired = await rulesFiredFor(
      "packages/functions/src/x.ts",
      'import sharp from "sharp"; import { S3Client } from "@aws-sdk/client-s3"; export const a = [sharp, S3Client];',
    );
    expect(fired).not.toContain(LAYER);
    expect(fired).not.toContain(PACKAGE);
  });

  it("bans the web app", async () => {
    const fired = await rulesFiredFor(
      "packages/functions/src/x.ts",
      'import { a } from "@marino/web/src/services/media"; export { a };',
    );
    expect(fired).toContain(LAYER);
  });

  it("bans React", async () => {
    const fired = await rulesFiredFor(
      "packages/functions/src/x.ts",
      'import { useState } from "react"; export const a = useState;',
    );
    expect(fired).toContain(LAYER);
  });
});

describe("client controllers (apps/web/src/services/)", () => {
  it("bans React", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/services/x.ts",
      'import { useState } from "react"; export const a = useState;',
    );
    expect(fired).toContain(LAYER);
  });

  it("bans the view layer", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/services/x.ts",
      'import { Button } from "@/components/ui/Button"; export const a = Button;',
    );
    expect(fired).toContain(LAYER);
  });

  it("may fetch", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/services/x.ts",
      'export const a = () => fetch("/media/manifest.json");',
    );
    expect(fired).not.toContain(GLOBALS);
  });

  it("bans the AWS SDK", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/services/x.ts",
      'import { S3Client } from "@aws-sdk/client-s3"; export const a = S3Client;',
    );
    expect(fired).toContain(PACKAGE);
  });
});

describe("view layer (apps/web/src/{pages,layouts,components}/)", () => {
  it("bans astro:content in a component", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/sections/X.tsx",
      'import { getCollection } from "astro:content"; export const a = getCollection;',
    );
    expect(fired).toContain(LAYER);
  });

  it("bans astro:content in a page", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/pages/x.astro",
      '---\nimport { getCollection } from "astro:content";\nconst a = await getCollection("services");\n---\n<p>{a.length}</p>\n',
    );
    expect(fired).toContain(LAYER);
  });

  it("bans fetch", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/gallery/X.tsx",
      'export const load = () => fetch("/media/manifest.json");',
    );
    expect(fired).toContain(GLOBALS);
  });

  it("bans window.localStorage", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/admin/X.tsx",
      'export const t = () => window.localStorage.getItem("x");',
    );
    expect(fired).toContain("local/no-window-storage");
  });

  it("bans the AWS SDK", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/site/X.tsx",
      'import { S3Client } from "@aws-sdk/client-s3"; export const a = S3Client;',
    );
    expect(fired).toContain(PACKAGE);
  });

  it("bans hand-rolled native controls", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/admin/X.tsx",
      "export const X = () => <button>hi</button>;",
    );
    expect(fired).toContain(SYNTAX);
  });

  it('bans role="button"', async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/admin/X.tsx",
      'export const X = () => <div role="button">hi</div>;',
    );
    expect(fired).toContain("local/prefer-button-component");
  });

  it("may import domain values and services", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/gallery/X.tsx",
      'import { sortItems } from "@marino/domain"; import { getManifest } from "@/services/media"; export const a = [sortItems, getManifest];',
    );
    expect(fired).not.toContain(LAYER);
    expect(fired).not.toContain(PACKAGE);
  });

  it("bans a copy dictionary imported directly, in a page or a component", async () => {
    const page = await rulesFiredFor(
      "apps/web/src/pages/x.astro",
      '---\nimport { copy } from "@/content/copy";\n---\n<p>{copy.en.nav.home}</p>\n',
    );
    expect(page).toContain(LAYER);
    const island = await rulesFiredFor(
      "apps/web/src/components/gallery/X.tsx",
      'import { es } from "@/content/copy/es"; export const a = es;',
    );
    expect(island).toContain(LAYER);
  });

  it("allows copy types, which an island's props are declared with", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/gallery/X.tsx",
      'import type { GalleryCopy } from "@/content/copy"; export const a = (c: GalleryCopy) => c.all;',
    );
    expect(fired).not.toContain(LAYER);
  });

  it("bans i18n() in an island but allows it in a static component", async () => {
    const island = await rulesFiredFor(
      "apps/web/src/components/gallery/X.tsx",
      'import { i18n } from "@/services/i18n"; export const a = i18n("es");',
    );
    expect(island).toContain(ISLAND);
    const page = await rulesFiredFor(
      "apps/web/src/components/sections/X.astro",
      '---\nimport { i18n } from "@/services/i18n";\nconst { t } = i18n(Astro.currentLocale);\n---\n<p>{t.nav.home}</p>\n',
    );
    expect(page).not.toContain(ISLAND);
    expect(page).not.toContain(LAYER);
  });
});

describe("primitive kit (apps/web/src/components/ui/)", () => {
  it("may render native controls", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/ui/Button.tsx",
      "export const Button = () => <button>hi</button>;",
    );
    expect(fired).not.toContain(SYNTAX);
  });

  it("bans domain values", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/ui/X.tsx",
      'import { sortItems } from "@marino/domain"; export const a = sortItems;',
    );
    expect(fired).toContain(LAYER);
  });

  it("allows domain types", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/ui/X.tsx",
      'import type { MediaCategory } from "@marino/domain"; export const a = (c: MediaCategory) => c;',
    );
    expect(fired).not.toContain(LAYER);
  });

  it("bans services", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/ui/X.tsx",
      'import { getManifest } from "@/services/media"; export const a = getManifest;',
    );
    expect(fired).toContain(LAYER);
  });

  it("allows content types but not content values", async () => {
    const typeOnly = await rulesFiredFor(
      "apps/web/src/components/ui/X.tsx",
      'import type { IconName } from "@/content/icons"; export const a = (n: IconName) => n;',
    );
    expect(typeOnly).not.toContain(LAYER);
    const value = await rulesFiredFor(
      "apps/web/src/components/ui/X.tsx",
      'import { ICON_NAMES } from "@/content/icons"; export const a = ICON_NAMES;',
    );
    expect(value).toContain(LAYER);
  });

  it("still may not fetch", async () => {
    const fired = await rulesFiredFor(
      "apps/web/src/components/ui/X.tsx",
      'export const load = () => fetch("/x");',
    );
    expect(fired).toContain(GLOBALS);
  });
});
