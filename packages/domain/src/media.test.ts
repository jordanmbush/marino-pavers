import { describe, expect, it } from "vitest";
import { isMediaId, newMediaId } from "./ids";
import { isReady, manifestSchema, mediaItemSchema } from "./media";

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
    expect(isReady(item)).toBe(false);
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
