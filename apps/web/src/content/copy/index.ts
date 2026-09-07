import type { Locale } from "../locales";
import { en, type Copy } from "./en";
import { es } from "./es";

/** One dictionary per locale. Views reach it through `i18n()` in `@/services/i18n`. */
export const copy: Record<Locale, Copy> = { en, es };

export type { Copy };

/** The slice the photo grid island receives as a prop. */
export type GalleryCopy = Copy["gallery"];
