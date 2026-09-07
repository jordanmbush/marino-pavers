import { MEDIA_CATEGORIES } from "@marino/domain";
import { describe, expect, it } from "vitest";
import { nav } from "../site";
import { copy } from "./index";
import { en } from "./en";
import { es } from "./es";

/**
 * What the type system can't promise about the dictionaries. `es` is typed
 * as `Copy`, so a missing key is a compile error — but a template that
 * renamed a `{slot}`, an empty string, or a meta description search engines
 * will cut short all type-check fine.
 */

/** Every string in a dictionary, with a dotted path to it, in source order. */
const strings = (value: unknown, path = ""): Array<[string, string]> => {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value))
    return value.flatMap((item, i) => strings(item, `${path}[${i}]`));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([key, item]) =>
      strings(item, path ? `${path}.${key}` : key),
    );
  return [];
};

const slotsOf = (template: string) =>
  [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

/** Search results show roughly this much before cutting a title or description. */
const TITLE_MAX = 70;
const DESCRIPTION_MAX = 160;

describe("copy dictionaries", () => {
  const english = strings(en);
  const spanish = strings(es);

  it("have the same strings in every language, including list lengths", () => {
    expect(spanish.map(([path]) => path)).toEqual(
      english.map(([path]) => path),
    );
  });

  it("leave nothing blank", () => {
    for (const [path, value] of [...english, ...spanish]) {
      expect(value.trim(), path).not.toBe("");
    }
  });

  it("use the same {slots} in every language", () => {
    const spanishByPath = new Map(spanish);
    for (const [path, value] of english) {
      expect(slotsOf(spanishByPath.get(path) ?? ""), path).toEqual(
        slotsOf(value),
      );
    }
  });

  it("label every nav route and every photo category", () => {
    for (const dictionary of Object.values(copy)) {
      for (const item of nav) expect(dictionary.nav[item.id]).toBeTruthy();
      for (const { slug } of MEDIA_CATEGORIES)
        expect(dictionary.gallery.categories[slug]).toBeTruthy();
    }
  });

  it("keep page titles and descriptions inside what search results show", () => {
    for (const [locale, dictionary] of Object.entries(copy)) {
      const pages = {
        home: {
          title: dictionary.home.title,
          description: dictionary.description,
        },
        services: dictionary.servicesPage,
        gallery: dictionary.galleryPage,
      };
      for (const [page, { title, description }] of Object.entries(pages)) {
        expect(title.length, `${locale} ${page} title`).toBeLessThanOrEqual(
          TITLE_MAX,
        );
        expect(
          description.length,
          `${locale} ${page} description`,
        ).toBeLessThanOrEqual(DESCRIPTION_MAX);
      }
    }
  });
});
