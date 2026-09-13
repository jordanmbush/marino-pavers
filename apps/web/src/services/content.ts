import {
  getCollection,
  type CollectionEntry,
  type CollectionKey,
} from "astro:content";
import type { Locale } from "@/content/locales";
import { inLocale } from "./locale";

/**
 * The one place a page reads a content collection. Each accessor returns
 * plain data in display order, flattened to one language, so a view never
 * sorts, never sees an entry wrapper or the other locale's text, and never
 * imports astro:content (the lint config bans it there).
 */

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

const dataOf = async <C extends CollectionKey>(collection: C, locale: Locale) =>
  (await getCollection(collection)).map((entry) =>
    inLocale(entry.data as CollectionEntry<C>["data"], locale),
  );

export const getServices = async (locale: Locale) =>
  (await dataOf("services", locale)).sort(byOrder);

export const getProcess = async (locale: Locale) =>
  (await dataOf("process", locale)).sort(byOrder);

export const getFaqs = async (locale: Locale) =>
  (await dataOf("faqs", locale)).sort(byOrder);

export type Service = Awaited<ReturnType<typeof getServices>>[number];
export type ProcessStep = Awaited<ReturnType<typeof getProcess>>[number];
export type Faq = Awaited<ReturnType<typeof getFaqs>>[number];
