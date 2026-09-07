import { describe, expect, it } from "vitest";
import {
  alternatesOf,
  asLocale,
  fill,
  inLocale,
  localePath,
  localeParams,
  splitLocale,
} from "./locale";

describe("asLocale", () => {
  it("keeps a known locale and falls back to English for anything else", () => {
    expect(asLocale("es")).toBe("es");
    expect(asLocale("en")).toBe("en");
    expect(asLocale("fr")).toBe("en");
    expect(asLocale(undefined)).toBe("en");
  });
});

describe("localePath", () => {
  it("leaves English routes alone", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/services")).toBe("/services");
  });

  it("prefixes Spanish routes, including the home page and query strings", () => {
    expect(localePath("es", "/")).toBe("/es");
    expect(localePath("es", "/services#driveways")).toBe(
      "/es/services#driveways",
    );
    expect(localePath("es", "/gallery?category=turf")).toBe(
      "/es/gallery?category=turf",
    );
  });
});

describe("splitLocale", () => {
  it("reads the prefix off a Spanish path", () => {
    expect(splitLocale("/es/services")).toEqual({
      locale: "es",
      path: "/services",
    });
    expect(splitLocale("/es/services/")).toEqual({
      locale: "es",
      path: "/services/",
    });
    expect(splitLocale("/es")).toEqual({ locale: "es", path: "/" });
    expect(splitLocale("/es/")).toEqual({ locale: "es", path: "/" });
  });

  it("treats everything else as English, untouched", () => {
    expect(splitLocale("/")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/services/")).toEqual({
      locale: "en",
      path: "/services/",
    });
    expect(splitLocale("/estimates")).toEqual({
      locale: "en",
      path: "/estimates",
    });
  });
});

describe("alternatesOf", () => {
  it("mirrors a page into every language from either side", () => {
    expect(alternatesOf("/services")).toEqual({
      en: "/services",
      es: "/es/services",
    });
    expect(alternatesOf("/es/services")).toEqual({
      en: "/services",
      es: "/es/services",
    });
  });

  it("keeps the trailing slash the build uses so hreflang matches canonical", () => {
    expect(alternatesOf("/services/")).toEqual({
      en: "/services/",
      es: "/es/services/",
    });
    expect(alternatesOf("/")).toEqual({ en: "/", es: "/es/" });
    expect(alternatesOf("/es/")).toEqual({ en: "/", es: "/es/" });
  });
});

describe("localeParams", () => {
  it("builds the default locale at the root and the rest under a prefix", () => {
    expect(localeParams()).toEqual([
      { params: { locale: undefined } },
      { params: { locale: "es" } },
    ]);
  });
});

describe("fill", () => {
  it("fills named slots and leaves unknown ones visible", () => {
    expect(fill("Showing {shown} of {total}.", { shown: 3, total: 12 })).toBe(
      "Showing 3 of 12.",
    );
    expect(fill("See {service} — {missing}", { service: "turf" })).toBe(
      "See turf — {missing}",
    );
  });
});

describe("inLocale", () => {
  const entry = {
    id: "turf",
    order: 3,
    en: { title: "Artificial Turf" },
    es: { title: "Pasto sintético" },
  };

  it("flattens an entry to one language and drops the others", () => {
    expect(inLocale(entry, "es")).toEqual({
      id: "turf",
      order: 3,
      title: "Pasto sintético",
    });
    expect(inLocale(entry, "en")).toEqual({
      id: "turf",
      order: 3,
      title: "Artificial Turf",
    });
  });
});
