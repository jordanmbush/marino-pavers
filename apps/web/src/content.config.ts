import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";
import { MEDIA_CATEGORIES, type MediaCategory } from "@marino/domain";
import type { Locale } from "./content/locales";

/**
 * The site's editorial content, validated at build. Business facts (phone,
 * nav routes) live in `content/site.ts` as a typed constant; these
 * collections hold the lists a page iterates over.
 *
 * Every entry carries its text once per language, as sibling `en` / `es`
 * blocks beside the fields that don't translate (id, order…). The
 * content service picks one block by locale, so a view sees a flat entry.
 */

/**
 * The photo categories the gallery filters by. Rebuilt with Astro's zod
 * rather than reusing the domain's schema object: the two zod copies are
 * separate packages, and a schema from one is opaque to the other.
 */
const category = z.enum(
  MEDIA_CATEGORIES.map((c) => c.slug) as [MediaCategory, ...MediaCategory[]],
);

/** The same text fields, once per locale. A missing language fails the build. */
const localized = <Shape extends Record<string, z.ZodType>>(shape: Shape) =>
  ({
    en: z.object(shape),
    es: z.object(shape),
  }) satisfies Record<Locale, unknown>;

const services = defineCollection({
  loader: file("src/content/services.json"),
  schema: z.object({
    id: z.string(),
    order: z.number().int(),
    /** Which photo category this service's gallery link filters to. */
    category,
    ...localized({
      title: z.string(),
      tagline: z.string(),
      description: z.string(),
      features: z.array(z.string()).min(1),
    }),
  }),
});

const process = defineCollection({
  loader: file("src/content/process.json"),
  schema: z.object({
    id: z.string(),
    order: z.number().int(),
    ...localized({ title: z.string(), body: z.string() }),
  }),
});

const faqs = defineCollection({
  loader: file("src/content/faqs.json"),
  schema: z.object({
    id: z.string(),
    order: z.number().int(),
    ...localized({ question: z.string(), answer: z.string() }),
  }),
});

export const collections = { services, process, faqs };
