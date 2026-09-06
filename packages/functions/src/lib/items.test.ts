import {
  MANIFEST_KEY,
  itemKey,
  originalKey,
  renditionKey,
  type MediaItem,
} from "@marino/domain";
import { describe, expect, it } from "vitest";
import {
  deleteItemAndDerived,
  deleteStaleRenditions,
  listItems,
  readItem,
  rebuildManifest,
  writeItem,
} from "./items";
import { silentLogger } from "./logger";
import { createMemoryStore } from "./memory-store";

const ID_A = "aaaaaaaaaaaaaaaa";
const ID_B = "bbbbbbbbbbbbbbbb";

const item = (id: string, overrides: Partial<MediaItem> = {}): MediaItem => ({
  id,
  status: "ready",
  title: id,
  category: "patios",
  city: "",
  detail: "",
  featured: false,
  order: 0,
  rotation: 0,
  original: {
    key: originalKey(id, "jpg"),
    contentType: "image/jpeg",
    bytes: 3,
  },
  image: { width: 10, height: 10, widths: [10], placeholder: "data:," },
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
  ...overrides,
});

describe("item repository", () => {
  it("writes, reads and lists", async () => {
    const store = createMemoryStore();
    await writeItem(store, item(ID_A));
    await writeItem(store, item(ID_B));
    expect(await readItem(store, ID_A, silentLogger)).toEqual(item(ID_A));
    expect(await readItem(store, "cccccccccccccccc", silentLogger)).toBeNull();
    expect(
      (await listItems(store, silentLogger)).map((i) => i.id).sort(),
    ).toEqual([ID_A, ID_B]);
    expect(store.objects.get(itemKey(ID_A))?.cacheControl).toBe("no-store");
  });

  it("treats a corrupt record as missing", async () => {
    const store = createMemoryStore();
    await store.putObject(itemKey(ID_A), "{not json", "application/json");
    await store.putObject(
      itemKey(ID_B),
      JSON.stringify({ id: ID_B }),
      "application/json",
    );
    expect(await readItem(store, ID_A, silentLogger)).toBeNull();
    expect(await readItem(store, ID_B, silentLogger)).toBeNull();
    expect(await listItems(store, silentLogger)).toEqual([]);
  });

  it("rebuilds a manifest of ready items only", async () => {
    const store = createMemoryStore();
    await writeItem(store, item(ID_A, { order: 2 }));
    await writeItem(store, item(ID_B, { status: "pending", image: undefined }));
    const manifest = await rebuildManifest(
      store,
      new Date("2026-09-06T12:00:00Z"),
      silentLogger,
    );
    expect(manifest.items.map((i) => i.id)).toEqual([ID_A]);
    const written = store.objects.get(MANIFEST_KEY);
    expect(written?.contentType).toBe("application/json");
    expect(written?.cacheControl).toContain("max-age=60");
    expect(JSON.parse(written!.body.toString("utf8"))).toEqual(manifest);
  });

  it("deletes the record, renditions and original together", async () => {
    const store = createMemoryStore();
    await writeItem(store, item(ID_A));
    await store.putObject(
      originalKey(ID_A, "jpg"),
      Buffer.from("o"),
      "image/jpeg",
    );
    await store.putObject(
      renditionKey(ID_A, 0, 480),
      Buffer.from("r"),
      "image/webp",
    );
    await store.putObject(
      renditionKey(ID_A, 90, 480),
      Buffer.from("r"),
      "image/webp",
    );
    await writeItem(store, item(ID_B));
    await deleteItemAndDerived(store, ID_A);
    expect([...store.objects.keys()]).toEqual([itemKey(ID_B)]);
  });

  it("keeps only the rendition set made at the current rotation", async () => {
    const store = createMemoryStore();
    for (const [rotation, width] of [
      [0, 480],
      [0, 960],
      [90, 480],
      [180, 480],
    ] as const) {
      await store.putObject(
        renditionKey(ID_A, rotation, width),
        Buffer.from("r"),
        "image/webp",
      );
    }
    await store.putObject(
      renditionKey(ID_B, 0, 480),
      Buffer.from("r"),
      "image/webp",
    );
    await deleteStaleRenditions(store, ID_A, 90);
    expect([...store.objects.keys()].sort()).toEqual([
      renditionKey(ID_A, 90, 480),
      renditionKey(ID_B, 0, 480),
    ]);
  });
});
