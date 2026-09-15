import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MediaItem } from "@marino/domain";
import { ItemRow } from "./ItemRow";

const item: MediaItem = {
  id: "0123456789abcdef",
  status: "ready",
  kind: "photo",
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
  onRetry: () => undefined,
};

const video: MediaItem = {
  ...item,
  kind: "video",
  original: { key: "originals/x.mp4", contentType: "video/mp4", bytes: 1 },
  video: {
    width: 1920,
    height: 1080,
    heights: [480, 1080],
    durationSeconds: 8,
  },
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

  it("marks a ready video as one, so the client can tell the two apart", () => {
    const html = renderToStaticMarkup(
      <ItemRow item={video} first last {...handlers} />,
    );
    expect(html).toContain(">Video</span>");
    // The poster is a photo like any other, renditions and all.
    expect(html).toContain("/renditions/0123456789abcdef/r0/480.webp");
  });

  it("warns that turning a video re-processes it", () => {
    const html = renderToStaticMarkup(
      <ItemRow item={video} first last {...handlers} />,
    );
    expect(html).toMatch(/title="Saving a turned video[^"]*minute or two/);
  });

  it("offers a retry, and says why, only when processing failed", () => {
    const ok = renderToStaticMarkup(
      <ItemRow item={video} first last {...handlers} />,
    );
    expect(ok).not.toContain("Retry");

    const html = renderToStaticMarkup(
      <ItemRow
        item={{
          ...video,
          status: "failed",
          image: undefined,
          video: undefined,
          error: "The transcode failed.",
        }}
        first
        last
        {...handlers}
      />,
    );
    expect(html).toContain("The transcode failed.");
    expect(html).toContain("Didn\u2019t process");
    expect(html).toMatch(/<button[^>]*aria-label="Try processing again"/);
  });
});
