import {
  getCollection,
  type CollectionEntry,
  type CollectionKey,
} from "astro:content";

/**
 * The one place a page reads a content collection. Each accessor returns
 * plain data in display order, so a view never sorts, never sees an entry
 * wrapper, and never imports astro:content (the lint config bans it there).
 */

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

const dataOf = async <C extends CollectionKey>(
  collection: C,
): Promise<Array<CollectionEntry<C>["data"]>> =>
  (await getCollection(collection)).map((entry) => entry.data);

export const getServices = async () => (await dataOf("services")).sort(byOrder);

export const getProcess = async () => (await dataOf("process")).sort(byOrder);

export const getTestimonials = async () =>
  (await dataOf("testimonials")).sort(byOrder);

export const getFaqs = async () => (await dataOf("faqs")).sort(byOrder);

export const getValues = async () => (await dataOf("values")).sort(byOrder);

export type Service = CollectionEntry<"services">["data"];
export type ProcessStep = CollectionEntry<"process">["data"];
export type Testimonial = CollectionEntry<"testimonials">["data"];
export type Faq = CollectionEntry<"faqs">["data"];
export type Value = CollectionEntry<"values">["data"];
