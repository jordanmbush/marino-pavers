import { getContainerRenderer } from "@astrojs/react/container-renderer";
import type { SSRManifest } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import { loadRenderers } from "astro:container";
import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES } from "@/content/locales";
import Base from "@/layouts/Base.astro";
import Header from "./Header.astro";
import LanguageSwitcher from "./LanguageSwitcher.astro";

/**
 * The chrome renders in the language of the URL, and every link it emits
 * stays in that language. Components go through Astro's container with the
 * site's i18n manifest, so `Astro.currentLocale` resolves the way it does in
 * a build: from the path prefix. The React renderer is loaded because the
 * header's icons are React components rendered to static SVG.
 */
const SITE = "https://marinopavers.com";
const renderers = await loadRenderers([getContainerRenderer()]);

/** The container fills in the rest of the manifest; its type asks for all of it. */
const manifest = {
  i18n: {
    strategy: "pathname-prefix-other-locales",
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    domainLookupTable: {},
    fallback: undefined,
    fallbackType: "redirect",
    domains: undefined,
  },
} satisfies Partial<SSRManifest> as SSRManifest;

const render = async (
  component: AstroComponentFactory,
  pathname: string,
  props: Record<string, unknown>,
  slots?: Record<string, string>,
) => {
  const container = await AstroContainer.create({
    renderers,
    astroConfig: { site: SITE },
    manifest,
  });
  return container.renderToString(component, {
    request: new Request(`${SITE}${pathname}`),
    props,
    slots,
  });
};

const services = { en: "/services/", es: "/es/services/" };

describe("LanguageSwitcher", () => {
  it("marks the current language and links the other, on a Spanish page", async () => {
    const html = await render(LanguageSwitcher, "/es/services/", {
      alternates: services,
    });
    expect(html).toContain('aria-label="Idioma"');
    expect(html).toMatch(
      /<a href="\/es\/services\/"[^>]*aria-label="Español" aria-current="true"/,
    );
    expect(html).toMatch(/<a href="\/services\/"[^>]*aria-label="English"/);
    // The phone-sized toggle offers only the other language.
    expect(html).toMatch(
      /<a href="\/services\/"[^>]*aria-label="English"[^>]*lg:hidden/,
    );
  });

  it("does the same from the English side", async () => {
    const html = await render(LanguageSwitcher, "/services/", {
      alternates: services,
    });
    expect(html).toContain('aria-label="Language"');
    expect(html).toMatch(
      /<a href="\/services\/"[^>]*aria-label="English" aria-current="true"/,
    );
    expect(html).toMatch(
      /<a href="\/es\/services\/"[^>]*aria-label="Español"[^>]*lg:hidden/,
    );
  });
});

describe("Header", () => {
  it("renders Spanish labels and Spanish links on a Spanish page", async () => {
    const html = await render(Header, "/es/services/", {
      alternates: services,
    });
    expect(html).toContain('aria-label="Principal"');
    expect(html).toContain('href="/es"');
    expect(html).toContain('href="/es/gallery"');
    expect(html).toMatch(/<a href="\/es\/services" aria-current="page"/);
    for (const label of ["Inicio", "Servicios", "Galería de fotos"])
      expect(html).toContain(`>${label}</a>`);
    expect(html).toContain('aria-label="Abrir menú"');
    expect(html).toContain('data-label-close="Cerrar menú"');
    expect(html).not.toContain('href="/services"');
  });

  it("lights only the current page in English", async () => {
    const html = await render(Header, "/gallery/", { alternates: services });
    expect(html).toMatch(/<a href="\/gallery" aria-current="page"/);
    expect(html).not.toMatch(/<a href="\/" aria-current/);
    expect(html).toContain(">Photo Gallery</a>");
  });
});

describe("Base", () => {
  const props = {
    title: "Servicios",
    description: "Descripción",
    alternates: services,
  };

  it("signs the SEO contract in the page's language", async () => {
    const html = await render(Base, "/es/services/", props, {
      default: "<p>x</p>",
    });
    expect(html).toContain('<html lang="es">');
    expect(html).toContain(
      `<link rel="canonical" href="${SITE}/es/services/">`,
    );
    expect(html).toContain(
      `<link rel="alternate" hreflang="en" href="${SITE}/services/">`,
    );
    expect(html).toContain(
      `<link rel="alternate" hreflang="es" href="${SITE}/es/services/">`,
    );
    expect(html).toContain(
      `<link rel="alternate" hreflang="x-default" href="${SITE}/services/">`,
    );
    expect(html).toContain('property="og:locale" content="es_US"');
    expect(html).toContain('property="og:locale:alternate" content="en_US"');
    // The LocalBusiness description follows the page's language too.
    expect(html).toContain("Patios de adoquín");
  });

  it("drops the hreflang links from a page it must not index", async () => {
    const html = await render(
      Base,
      "/admin/",
      { ...props, noindex: true },
      { default: "<p>x</p>" },
    );
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).not.toContain("hreflang");
    expect(html).toContain('<html lang="en">');
  });
});
