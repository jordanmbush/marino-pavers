import {
  MANIFEST_KEY,
  itemKey,
  originalKey,
  renditionKey,
  type MediaItem,
} from "@marino/domain";
import type { S3Event, S3EventRecord } from "aws-lambda";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { readItem, writeItem } from "./lib/items";
import { silentLogger } from "./lib/logger";
import { createMemoryStore } from "./lib/memory-store";
import { createProcessImageHandler } from "./process-image";

const ID = "0123456789abcdef";

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#888" } })
    .png()
    .toBuffer();

/** Only the fields the handler reads; the rest of an S3 record is noise here. */
const record = (key: string): S3EventRecord =>
  ({
    s3: { bucket: { name: "media" }, object: { key: encodeURIComponent(key) } },
  }) as S3EventRecord;

const event = (...keys: string[]): S3Event => ({ Records: keys.map(record) });

const pending = (): MediaItem => ({
  id: ID,
  status: "pending",
  title: "Desert Ridge patio",
  category: "pool-decks",
  city: "Phoenix",
  detail: "",
  featured: true,
  order: 0,
  original: { key: originalKey(ID, "png"), contentType: "image/png", bytes: 1 },
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
});

const NOW = new Date("2026-09-06T12:00:00Z");

describe("process-image handler", () => {
  it("renders, marks the pending item ready and publishes the manifest", async () => {
    const store = createMemoryStore();
    await writeItem(store, pending());
    await store.putObject(
      originalKey(ID, "png"),
      await png(1200, 900),
      "image/png",
    );

    await createProcessImageHandler({
      store,
      now: () => NOW,
      logger: silentLogger,
    })(event(originalKey(ID, "png")));

    for (const width of [480, 960, 1200]) {
      const rendition = store.objects.get(renditionKey(ID, width));
      expect(rendition?.contentType).toBe("image/webp");
      expect(rendition?.cacheControl).toContain("immutable");
    }
    const item = await readItem(store, ID, silentLogger);
    expect(item?.status).toBe("ready");
    expect(item?.title).toBe("Desert Ridge patio");
    expect(item?.category).toBe("pool-decks");
    expect(item?.featured).toBe(true);
    expect(item?.image).toMatchObject({
      width: 1200,
      height: 900,
      widths: [480, 960, 1200],
    });
    expect(item?.updatedAt).toBe(NOW.toISOString());

    const manifest = JSON.parse(
      store.objects.get(MANIFEST_KEY)!.body.toString("utf8"),
    );
    expect(manifest.items.map((i: MediaItem) => i.id)).toEqual([ID]);
  });

  it("creates a record for an original that was never registered", async () => {
    const store = createMemoryStore();
    await store.putObject(
      originalKey(ID, "jpg"),
      await png(600, 400),
      "image/jpeg",
    );
    await createProcessImageHandler({
      store,
      now: () => NOW,
      logger: silentLogger,
    })(event(originalKey(ID, "jpg")));
    const item = await readItem(store, ID, silentLogger);
    expect(item?.status).toBe("ready");
    expect(item?.category).toBe("patios");
    expect(item?.original).toEqual({
      key: originalKey(ID, "jpg"),
      contentType: "image/jpeg",
      bytes: (await png(600, 400)).length,
    });
    expect(item?.createdAt).toBe(NOW.toISOString());
  });

  it("decodes url-encoded keys and ignores keys outside originals/", async () => {
    const store = createMemoryStore();
    await store.putObject(
      renditionKey(ID, 480),
      Buffer.from("x"),
      "image/webp",
    );
    await createProcessImageHandler({ store, logger: silentLogger })(
      event(renditionKey(ID, 480), "items/x.json"),
    );
    expect(store.objects.size).toBe(1);
    expect(store.objects.has(MANIFEST_KEY)).toBe(false);
  });

  it("keeps going after a record that fails", async () => {
    const store = createMemoryStore();
    const bad = "ffffffffffffffff";
    await store.putObject(
      originalKey(bad, "jpg"),
      Buffer.from("not an image"),
      "image/jpeg",
    );
    await store.putObject(
      originalKey(ID, "png"),
      await png(500, 500),
      "image/png",
    );

    await createProcessImageHandler({
      store,
      now: () => NOW,
      logger: silentLogger,
    })(event(originalKey(bad, "jpg"), originalKey(ID, "png")));

    expect(await readItem(store, bad, silentLogger)).toBeNull();
    expect((await readItem(store, ID, silentLogger))?.status).toBe("ready");
    expect(store.objects.has(itemKey(ID))).toBe(true);
  });

  it("skips an original that has already gone", async () => {
    const store = createMemoryStore();
    await createProcessImageHandler({ store, logger: silentLogger })(
      event(originalKey(ID, "png")),
    );
    expect(store.objects.size).toBe(0);
  });
});
