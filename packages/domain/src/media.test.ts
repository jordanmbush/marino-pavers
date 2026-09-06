import { describe, expect, it } from "vitest";
import { isMediaId, newMediaId } from "./ids";
import {
  draftOf,
  editableItemSchema,
  editablePatch,
  isReady,
  manifestSchema,
  mediaItemSchema,
  turn,
  type MediaItem,
} from "./media";

describe("mediaItemSchema", () => {
  it("fills defaults and accepts a pending item without an image", () => {
    const item = mediaItemSchema.parse({
      id: "0123456789abcdef",
      status: "pending",
      category: "turf",
      original: {
        key: "originals/0123456789abcdef.png",
        contentType: "image/png",
        bytes: 5,
      },
      createdAt: "2026-09-06T00:00:00.000Z",
      updatedAt: "2026-09-06T00:00:00.000Z",
    });
    expect(item.title).toBe("");
    expect(item.featured).toBe(false);
    expect(item.order).toBe(0);
    expect(item.rotation).toBe(0);
    expect(isReady(item)).toBe(false);
  });

  it("accepts quarter turns only", () => {
    const base = {
      id: "0123456789abcdef",
      status: "pending",
      category: "turf",
      original: { key: "k", contentType: "image/png", bytes: 5 },
      createdAt: "2026-09-06T00:00:00.000Z",
      updatedAt: "2026-09-06T00:00:00.000Z",
    };
    expect(mediaItemSchema.safeParse({ ...base, rotation: 270 }).success).toBe(
      true,
    );
    expect(mediaItemSchema.safeParse({ ...base, rotation: 45 }).success).toBe(
      false,
    );
    expect(mediaItemSchema.safeParse({ ...base, rotation: -90 }).success).toBe(
      false,
    );
  });

  it("rejects an unknown category and a bad id", () => {
    const base = {
      id: "0123456789abcdef",
      status: "ready",
      category: "gazebos",
      original: { key: "k", contentType: "image/png", bytes: 5 },
      createdAt: "2026-09-06T00:00:00.000Z",
      updatedAt: "2026-09-06T00:00:00.000Z",
    };
    expect(mediaItemSchema.safeParse(base).success).toBe(false);
    expect(
      mediaItemSchema.safeParse({ ...base, category: "turf", id: "short" })
        .success,
    ).toBe(false);
  });

  it("validates a manifest", () => {
    expect(
      manifestSchema.safeParse({
        version: 1,
        generatedAt: "2026-09-06T00:00:00.000Z",
        items: [],
      }).success,
    ).toBe(true);
    expect(
      manifestSchema.safeParse({ version: 2, generatedAt: "x", items: [] })
        .success,
    ).toBe(false);
  });
});

describe("ids", () => {
  it("makes ids that match the pattern and don't repeat", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newMediaId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(isMediaId(id)).toBe(true);
  });
});

describe("editableItemSchema", () => {
  it("carries only the fields it was given — no defaults sneak in", () => {
    expect(editableItemSchema.parse({ rotation: 90 })).toEqual({
      rotation: 90,
    });
    expect(editableItemSchema.parse({})).toEqual({});
    expect(
      editableItemSchema.safeParse({ title: "x".repeat(121) }).success,
    ).toBe(false);
  });
});

describe("turn", () => {
  it("steps a quarter turn either way and wraps", () => {
    expect(turn(0, 1)).toBe(90);
    expect(turn(270, 1)).toBe(0);
    expect(turn(0, -1)).toBe(270);
    expect(turn(180, -1)).toBe(90);
  });
});

describe("editablePatch", () => {
  const item: MediaItem = {
    id: "0123456789abcdef",
    status: "ready",
    title: "Desert Ridge patio",
    category: "patios",
    city: "Phoenix",
    detail: "",
    featured: false,
    order: 3,
    rotation: 0,
    original: { key: "originals/x.jpg", contentType: "image/jpeg", bytes: 1 },
    image: { width: 100, height: 100, widths: [100], placeholder: "data:," },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("is empty for an untouched draft", () => {
    expect(editablePatch(item, draftOf(item))).toEqual({});
  });

  it("carries only the fields that changed", () => {
    const draft = { ...draftOf(item), title: "Desert Ridge", featured: true };
    expect(editablePatch(item, draft)).toEqual({
      title: "Desert Ridge",
      featured: true,
    });
  });

  it("is empty again once a change is typed back", () => {
    const draft = { ...draftOf(item), city: "Phoenix" };
    expect(editablePatch(item, draft)).toEqual({});
  });

  it("carries a rotation, and drops it once turned back", () => {
    const once = { ...draftOf(item), rotation: turn(item.rotation, 1) };
    expect(editablePatch(item, once)).toEqual({ rotation: 90 });
    const back = { ...once, rotation: turn(once.rotation, -1) };
    expect(editablePatch(item, back)).toEqual({});
  });

  it("never touches order — that belongs to move", () => {
    expect(draftOf(item)).not.toHaveProperty("order");
  });
});
