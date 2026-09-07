/**
 * The languages the site is built in. Every public page is prerendered once
 * per locale: the default at the root (`/services`), the others under a
 * prefix (`/es/services`). Adding a locale here is a compile error wherever a
 * translation is missing — the copy dictionaries and the content schema both
 * key on `Locale`.
 */
export const LOCALES = ["en", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE = "en" satisfies Locale;

/** Each language named in itself — what the switcher announces. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

/** Open Graph's territory form of each locale. */
export const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  es: "es_US",
};
