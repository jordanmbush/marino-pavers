import { describe, expect, it } from "vitest";
import {
  buildManifest,
  featuredItems,
  filterByCategory,
  moveItem,
  sortItems,
  titleFromFilename,
} from "./manifest";
import type { MediaItem } from "./media";

const make = (id: string, overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: id.padStart(16, "0"),
  status: "ready",
  title: id,
  category: "patios",
  city: "",
  detail: "",
  featured: false,
  order: 0,
  rotation: 0,
  original: { key: `originals/${id}.jpg`, contentType: "image/jpeg", bytes: 1 },
  image: { width: 100, height: 100, widths: [100], placeholder: "data:," },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("sortItems", () => {
  it("orders by manual position, then newest first, then id", () => {
    const items = [
      make("a", { order: 2 }),
      make("b", { order: 1 }),
      make("c", { order: 0, createdAt: "2026-02-01T00:00:00.000Z" }),
      make("d", { order: 0, createdAt: "2026-03-01T00:00:00.000Z" }),
      make("e", { order: 0, createdAt: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(sortItems(items).map((i) => i.title)).toEqual([
      "d",
      "c",
      "e",
      "b",
      "a",
    ]);
  });

  it("does not mutate its input", () => {
    const items = [make("b", { order: 2 }), make("a", { order: 1 })];
    sortItems(items);
    expect(items[0]!.title).toBe("b");
  });
});

describe("buildManifest", () => {
  it("publishes ready items only, in display order", () => {
    const manifest = buildManifest(
      [
        make("a", { order: 2 }),
        make("p", { status: "pending", image: undefined }),
        make("b", { order: 1 }),
      ],
      new Date("2026-09-06T12:00:00Z"),
    );
    expect(manifest.version).toBe(1);
    expect(manifest.generatedAt).toBe("2026-09-06T12:00:00.000Z");
    expect(manifest.items.map((i) => i.title)).toEqual(["b", "a"]);
  });
});

describe("filterByCategory", () => {
  it("passes everything through for 'all'", () => {
    const items = [make("a"), make("b", { category: "turf" })];
    expect(filterByCategory(items, "all")).toHaveLength(2);
    expect(filterByCategory(items, "turf").map((i) => i.title)).toEqual(["b"]);
  });
});

describe("featuredItems", () => {
  it("puts featured first and tops up with the newest", () => {
    const items = [
      make("old", { createdAt: "2026-01-01T00:00:00.000Z" }),
      make("new", { createdAt: "2026-05-01T00:00:00.000Z" }),
      make("star", { featured: true, createdAt: "2025-01-01T00:00:00.000Z" }),
    ];
    expect(featuredItems(items, 2).map((i) => i.title)).toEqual([
      "star",
      "new",
    ]);
    expect(featuredItems(items, 0)).toEqual([]);
  });
});

describe("moveItem", () => {
  it("swaps neighbours and renumbers from 1", () => {
    const items = [
      make("a", { order: 1 }),
      make("b", { order: 2 }),
      make("c", { order: 3 }),
    ];
    const result = moveItem(items, make("c").id, -1);
    expect(result.map((r) => r.order)).toEqual([1, 2, 3]);
    expect(result.map((r) => r.id)).toEqual([
      make("a").id,
      make("c").id,
      make("b").id,
    ]);
  });

  it("clamps at the ends and ignores unknown ids", () => {
    const items = [make("a", { order: 1 }), make("b", { order: 2 })];
    expect(moveItem(items, make("a").id, -1).map((r) => r.id)).toEqual([
      make("a").id,
      make("b").id,
    ]);
    expect(moveItem(items, "nope", 1)).toEqual([]);
  });
});

describe("titleFromFilename", () => {
  it("humanises a descriptive name", () => {
    expect(titleFromFilename("desert-ridge_patio.JPG")).toBe(
      "Desert ridge patio",
    );
  });

  it("drops camera noise", () => {
    expect(titleFromFilename("IMG_4021.jpeg")).toBe("");
    expect(titleFromFilename("DSC00012.jpg")).toBe("");
    expect(titleFromFilename("20260906.png")).toBe("");
    expect(titleFromFilename("PXL_20260906_120000.jpg")).toBe("");
  });
});
