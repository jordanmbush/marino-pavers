import { describe, expect, it } from "vitest";
import type { ReadyMediaItem } from "./media";
import {
  fallbackSrc,
  pickRenditionWidths,
  renditionUrl,
  srcSet,
} from "./renditions";

const item: ReadyMediaItem = {
  id: "0123456789abcdef",
  status: "ready",
  title: "Desert Ridge patio",
  category: "patios",
  city: "Phoenix",
  detail: "",
  featured: false,
  order: 0,
  rotation: 0,
  original: {
    key: "originals/0123456789abcdef.jpg",
    contentType: "image/jpeg",
    bytes: 10,
  },
  image: {
    width: 1200,
    height: 900,
    widths: [480, 960, 1200],
    placeholder: "data:,",
  },
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
};

describe("pickRenditionWidths", () => {
  it("never upscales and always includes the original width", () => {
    expect(pickRenditionWidths(1200)).toEqual([480, 960, 1200]);
    expect(pickRenditionWidths(500)).toEqual([480, 500]);
    expect(pickRenditionWidths(400)).toEqual([400]);
  });

  it("caps at the largest standard width", () => {
    expect(pickRenditionWidths(4000)).toEqual([480, 960, 1440, 2048]);
    expect(pickRenditionWidths(2048)).toEqual([480, 960, 1440, 2048]);
  });

  it("tolerates nonsense", () => {
    expect(pickRenditionWidths(0)).toEqual([1]);
    expect(pickRenditionWidths(-5)).toEqual([1]);
  });
});

describe("urls", () => {
  it("joins the base without a double slash", () => {
    expect(renditionUrl("/media/", item, 480)).toBe(
      "/media/renditions/0123456789abcdef/r0/480.webp",
    );
    expect(renditionUrl("https://cdn.example.com", item, 480)).toBe(
      "https://cdn.example.com/renditions/0123456789abcdef/r0/480.webp",
    );
  });

  it("points at the set made for the item's rotation", () => {
    expect(renditionUrl("/media", { ...item, rotation: 180 }, 480)).toBe(
      "/media/renditions/0123456789abcdef/r180/480.webp",
    );
  });

  it("builds a srcset from every rendition", () => {
    expect(srcSet("/media", item)).toBe(
      "/media/renditions/0123456789abcdef/r0/480.webp 480w, /media/renditions/0123456789abcdef/r0/960.webp 960w, /media/renditions/0123456789abcdef/r0/1200.webp 1200w",
    );
  });

  it("falls back to the largest rendition", () => {
    expect(fallbackSrc("/media", item)).toBe(
      "/media/renditions/0123456789abcdef/r0/1200.webp",
    );
  });
});
