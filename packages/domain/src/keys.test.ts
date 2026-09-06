import { describe, expect, it } from "vitest";
import {
  itemKey,
  originalKey,
  parseItemKey,
  parseOriginalKey,
  renditionKey,
  renditionPrefix,
  renditionSetPrefix,
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
    expect(parseOriginalKey(renditionKey(ID, 0, 480))).toBeNull();
    expect(parseOriginalKey("originals/not-an-id.jpg")).toBeNull();
    expect(parseOriginalKey("originals/0123456789abcdef")).toBeNull();
  });

  it("nests renditions under the item id, then the rotation", () => {
    expect(renditionKey(ID, 0, 960)).toBe(`renditions/${ID}/r0/960.webp`);
    expect(renditionKey(ID, 270, 480)).toBe(`renditions/${ID}/r270/480.webp`);
    expect(renditionKey(ID, 90, 960).startsWith(renditionPrefix(ID))).toBe(
      true,
    );
    expect(
      renditionKey(ID, 90, 960).startsWith(renditionSetPrefix(ID, 90)),
    ).toBe(true);
    expect(
      renditionKey(ID, 90, 960).startsWith(renditionSetPrefix(ID, 0)),
    ).toBe(false);
  });

  it("round-trips an item key", () => {
    expect(parseItemKey(itemKey(ID))).toBe(ID);
    expect(parseItemKey("items/nope.json")).toBeNull();
  });
});
