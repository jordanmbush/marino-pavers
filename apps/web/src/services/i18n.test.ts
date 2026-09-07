import { describe, expect, it } from "vitest";
import { i18n } from "./i18n";

/**
 * `i18n()` is what every static component calls with `Astro.currentLocale`.
 * It has to agree with the URL layout: the dictionary it hands back must be
 * the page's language, and the links it builds must stay in that language.
 */
describe("i18n", () => {
  it("binds the Spanish dictionary and prefixes links for a Spanish page", () => {
    const { locale, t, href } = i18n("es");
    expect(locale).toBe("es");
    expect(t.nav.services).toBe("Servicios");
    expect(href("/services")).toBe("/es/services");
    expect(href("/")).toBe("/es");
  });

  it("binds English and leaves links unprefixed for an English page", () => {
    const { locale, t, href } = i18n("en");
    expect(locale).toBe("en");
    expect(t.nav.services).toBe("Services");
    expect(href("/services")).toBe("/services");
  });

  it("treats a missing or unknown locale as English", () => {
    // `Astro.currentLocale` is undefined on pages outside the locale folder
    // (404, admin) and would be an unlisted string if the config ever drifted.
    expect(i18n(undefined).locale).toBe("en");
    expect(i18n("fr").t.nav.home).toBe("Home");
  });
});
