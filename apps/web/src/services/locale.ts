import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/content/locales";

/**
 * Locale mechanics, with no copy attached: which language a URL is in, how a
 * route is prefixed for a language, and how a templated string is filled.
 * Pure, so the React islands can import it without dragging the dictionaries
 * into the browser bundle — `@/services/i18n` is the module that binds copy.
 */

const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/** `Astro.currentLocale` is an untyped string; anything unknown is the default. */
export const asLocale = (value: string | undefined): Locale =>
  value !== undefined && isLocale(value) ? value : DEFAULT_LOCALE;

/** "/services" → "/es/services". The default locale has no prefix; "/" → "/es". */
export const localePath = (locale: Locale, path: string): string => {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
};

/** The locale a pathname is in, and the pathname without that prefix. */
export const splitLocale = (
  pathname: string,
): { locale: Locale; path: string } => {
  const [, first = "", ...rest] = pathname.split("/");
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: `/${rest.join("/")}` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
};

/**
 * Where the page at `pathname` lives in every language. Keeps the input's
 * trailing-slash form — Astro's build passes `/services/`, and the hreflang
 * links must match the canonical built from the same pathname.
 */
export const alternatesOf = (pathname: string): Record<Locale, string> => {
  const { path } = splitLocale(pathname);
  const slash = pathname.endsWith("/");
  const entries = LOCALES.map((locale) => {
    const href = localePath(locale, path);
    return [locale, slash && !href.endsWith("/") ? `${href}/` : href];
  });
  return Object.fromEntries(entries) as Record<Locale, string>;
};

/**
 * One prerendered copy of a `src/pages/[...locale]/` page per language. The
 * default locale's param is `undefined`, which Astro builds at the root.
 */
export const localeParams = () =>
  LOCALES.map((locale) => ({
    params: { locale: locale === DEFAULT_LOCALE ? undefined : locale },
  }));

/** Fill a copy template: fill("See {service}", { service: "patios" }). Unknown slots stay put. */
export const fill = (
  template: string,
  values: Record<string, string | number>,
): string =>
  template.replace(/\{(\w+)\}/g, (slot, key: string) =>
    key in values ? String(values[key]) : slot,
  );

/**
 * A content entry with its text once per locale, as sibling `en` / `es`
 * blocks beside the fields that don't translate.
 */
type LocalizedEntry = Record<Locale, object>;

/** The entry flattened to one language: shared fields plus that locale's text. */
export type Localized<T> = Omit<T, Locale> &
  (T extends Record<Locale, infer Text> ? Text : never);

export const inLocale = <T extends LocalizedEntry>(
  entry: T,
  locale: Locale,
): Localized<T> => {
  const { en, es, ...shared } = entry;
  const text: Record<Locale, object> = { en, es };
  return { ...shared, ...text[locale] } as Localized<T>;
};
