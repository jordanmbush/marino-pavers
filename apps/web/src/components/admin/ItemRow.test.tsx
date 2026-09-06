import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MediaItem } from "@marino/domain";
import { ItemRow } from "./ItemRow";

const item: MediaItem = {
  id: "0123456789abcdef",
  status: "ready",
  title: "Desert Ridge patio",
  category: "patios",
  city: "Phoenix",
  detail: "Travertine · French pattern",
  featured: true,
  order: 0,
  rotation: 0,
  original: { key: "originals/x.jpg", contentType: "image/jpeg", bytes: 1 },
  image: {
    width: 1800,
    height: 1200,
    widths: [480, 960],
    placeholder: "data:,",
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const handlers = {
  onUpdate: () => Promise.resolve(true),
  onMove: () => undefined,
  onDelete: () => undefined,
};

/** Static markup only (no DOM in this suite): the resting state of the row. */
describe("ItemRow", () => {
  it("starts with Save disabled — nothing has changed yet", () => {
    const html = renderToStaticMarkup(
      <ItemRow item={item} first last {...handlers} />,
    );
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Save<\/button>/);
  });

  it("shows the stored values as the draft", () => {
    const html = renderToStaticMarkup(
      <ItemRow item={item} first last {...handlers} />,
    );
    expect(html).toContain('value="Desert Ridge patio"');
    expect(html).toContain('value="Phoenix"');
    expect(html).toContain("checked=");
  });

  it("shows the renditions made at the stored rotation", () => {
    const html = renderToStaticMarkup(
      <ItemRow item={{ ...item, rotation: 90 }} first last {...handlers} />,
    );
    expect(html).toContain("/renditions/0123456789abcdef/r90/480.webp");
    // Stored and draft agree, so nothing is previewed turned.
    expect(html).not.toMatch(/\brotate-(90|180)\b/);
  });

  it("offers a quarter turn each way", () => {
    const html = renderToStaticMarkup(
      <ItemRow item={item} first last {...handlers} />,
    );
    expect(html).toMatch(/<button[^>]*aria-label="Rotate left"[^>]*>/);
    expect(html).toMatch(/<button[^>]*aria-label="Rotate right"[^>]*>/);
    expect(html).not.toMatch(/aria-label="Rotate right"[^>]*disabled/);
  });

  it("marks a pending item as processing", () => {
    const html = renderToStaticMarkup(
      <ItemRow
        item={{ ...item, status: "pending", image: undefined }}
        first
        last
        {...handlers}
      />,
    );
    expect(html).toContain("Processing…");
    expect(html).not.toContain("<img");
    // Nothing to turn yet.
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*aria-label="Rotate left"/,
    );
  });
});
