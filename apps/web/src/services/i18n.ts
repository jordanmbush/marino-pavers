import { copy } from "@/content/copy";
import { asLocale, localePath } from "./locale";

/**
 * What a static component needs to render in one language: the locale, its
 * copy dictionary and a link builder that adds the locale's prefix.
 *
 *   const { locale, t, href } = i18n(Astro.currentLocale);
 *   <a href={href("/gallery")}>{t.nav.gallery}</a>
 *
 * Server-side only by intent — this pulls in every dictionary. Islands take
 * their slice of copy as a prop and use `@/services/locale` for the rest.
 */
export const i18n = (current: string | undefined) => {
  const locale = asLocale(current);
  return {
    locale,
    t: copy[locale],
    href: (path: string) => localePath(locale, path),
  };
};
