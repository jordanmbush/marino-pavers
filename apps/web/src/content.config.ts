import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";
import { ICON_NAMES } from "./content/icons";

/**
 * The site's editorial content, validated at build. Business facts (phone,
 * license, hours, nav) live in `content/site.ts` as a typed constant; these
 * collections hold the lists a page iterates over.
 */

const icon = z.enum(ICON_NAMES);

const services = defineCollection({
  loader: file("src/content/services.json"),
  schema: z.object({
    id: z.string(),
    order: z.number().int(),
    icon,
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    features: z.array(z.string()).min(1),
    /** Which photo category this service's gallery link filters to. */
    category: z.string(),
  }),
});

const process = defineCollection({
  loader: file("src/content/process.json"),
  schema: z.object({
    id: z.string(),
    order: z.number().int(),
    icon,
    title: z.string(),
    body: z.string(),
  }),
});

const testimonials = defineCollection({
  loader: file("src/content/testimonials.json"),
  schema: z.object({
    id: z.string(),
    order: z.number().int(),
    quote: z.string(),
    name: z.string(),
    city: z.string(),
    project: z.string(),
  }),
});

const faqs = defineCollection({
  loader: file("src/content/faqs.json"),
  schema: z.object({
    id: z.string(),
    order: z.number().int(),
    question: z.string(),
    answer: z.string(),
  }),
});

const values = defineCollection({
  loader: file("src/content/values.json"),
  schema: z.object({
    id: z.string(),
    order: z.number().int(),
    icon,
    title: z.string(),
    body: z.string(),
  }),
});

export const collections = { services, process, testimonials, faqs, values };
