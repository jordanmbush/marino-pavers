import { describe, expect, it } from "vitest";
import {
  itemKey,
  originalKey,
  parseItemKey,
  parseOriginalKey,
  renditionKey,
  renditionPrefix,
} from "./keys";

const ID = "0123456789abcdef";

describe("bucket keys", () => {
  it("round-trips an originals key", () => {
    expect(parseOriginalKey(originalKey(ID, "jpg"))).toEqual({
      id: ID,
      ext: "jpg",
    });
  });

  it("rejects keys outside originals/ or with a bad id", () => {
    expect(parseOriginalKey(renditionKey(ID, 480))).toBeNull();
    expect(parseOriginalKey("originals/not-an-id.jpg")).toBeNull();
    expect(parseOriginalKey("originals/0123456789abcdef")).toBeNull();
  });

  it("nests renditions under the item id", () => {
    expect(renditionKey(ID, 960)).toBe(`renditions/${ID}/960.webp`);
    expect(renditionKey(ID, 960).startsWith(renditionPrefix(ID))).toBe(true);
  });

  it("round-trips an item key", () => {
    expect(parseItemKey(itemKey(ID))).toBe(ID);
    expect(parseItemKey("items/nope.json")).toBeNull();
  });
});
