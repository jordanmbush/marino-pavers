import {
  MANIFEST_KEY,
  frameSetPrefix,
  framePrefix,
  itemKey,
  originalKey,
  renditionKey,
  videoRenditionKey,
  type MediaItem,
} from "@marino/domain";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { readItem, writeItem } from "./lib/items";
import { silentLogger } from "./lib/logger";
import { createMemoryStore, type MemoryStore } from "./lib/memory-store";
import {
  createVideoCompleteHandler,
  type JobStateEvent,
} from "./video-complete";

const ID = "0123456789abcdef";
const JOB = "job-1";
const BUCKET = "media";

const jpeg = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#888" } })
    .jpeg()
    .toBuffer();

const waiting = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: ID,
  status: "pending",
  kind: "video",
  title: "Desert Ridge patio",
  category: "pool-decks",
  city: "Phoenix",
  detail: "",
  featured: false,
  order: 0,
  rotation: 0,
  jobId: JOB,
  original: {
    key: originalKey(ID, "mp4"),
    contentType: "video/mp4",
    bytes: 1_000,
  },
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
  ...overrides,
});

const output = (key: string, width: number, height: number, ms: number) => ({
  outputFilePaths: [`s3://${BUCKET}/${key}`],
  durationInMs: ms,
  videoDetails: { widthInPx: width, heightInPx: height },
});

const completed = (
  rotation: 0 | 90 | 180 | 270 = 0,
  jobId = JOB,
): JobStateEvent => ({
  detail: {
    status: "COMPLETE",
    jobId,
    userMetadata: { mediaId: ID, rotation: String(rotation) },
    outputGroupDetails: [
      {
        outputDetails: [
          output(videoRenditionKey(ID, rotation, 480), 854, 480, 12_000),
          output(videoRenditionKey(ID, rotation, 1080), 1920, 1080, 12_000),
        ],
      },
      // The frame-capture group reports a JPEG, which is not a rendition.
      {
        outputDetails: [
          {
            outputFilePaths: [
              `s3://${BUCKET}/${frameSetPrefix(ID, rotation)}.0000002.jpg`,
            ],
          },
        ],
      },
    ],
  },
});

/** A finished job leaves its renditions in the bucket; so does this. */
const withRenditions = async (
  store: MemoryStore,
  rotation: 0 | 90 | 180 | 270 = 0,
) => {
  for (const height of [480, 1080]) {
    await store.putObject(
      videoRenditionKey(ID, rotation, height),
      Buffer.from("mp4"),
      // What MediaConvert may well have left behind.
      "binary/octet-stream",
    );
  }
};

/** A finished job leaves its captured frames in the bucket; so does this. */
const withFrames = async (
  store: MemoryStore,
  rotation: 0 | 90 | 180 | 270 = 0,
) => {
  const prefix = frameSetPrefix(ID, rotation);
  await store.putObject(
    `${prefix}.0000001.jpg`,
    await jpeg(60, 40),
    "image/jpeg",
  );
  await store.putObject(
    `${prefix}.0000002.jpg`,
    await jpeg(1600, 900),
    "image/jpeg",
  );
};

const run = (store: MemoryStore, event: JobStateEvent) =>
  createVideoCompleteHandler({
    store,
    now: () => new Date("2026-09-14T00:00:00.000Z"),
    logger: silentLogger,
  })(event);

describe("video-complete", () => {
  it("makes the poster renditions from the captured frame", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());
    await withFrames(store);
    await withRenditions(store);

    await run(store, completed());

    const item = await readItem(store, ID);
    expect(item?.status).toBe("ready");
    expect(item?.image?.widths).toEqual([480, 960, 1440, 1600]);
    expect(item?.image?.placeholder).toMatch(/^data:image\/webp;base64,/);
    for (const width of item!.image!.widths) {
      expect(store.objects.has(renditionKey(ID, 0, width))).toBe(true);
    }
  });

  it("takes the last frame, not the first one off the camera", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());
    await withFrames(store);
    await withRenditions(store);

    await run(store, completed());

    // The 1600×900 frame is `.0000002`; the 60×40 one came first.
    expect((await readItem(store, ID))?.image?.width).toBe(1600);
  });

  it("records the renditions the job actually wrote", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());
    await withFrames(store);
    await withRenditions(store);

    await run(store, completed());

    expect((await readItem(store, ID))?.video).toEqual({
      width: 1920,
      height: 1080,
      heights: [480, 1080],
      durationSeconds: 12,
    });
  });

  it("publishes the item to the manifest", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());
    await withFrames(store);
    await withRenditions(store);

    await run(store, completed());

    const manifest = JSON.parse(
      store.objects.get(MANIFEST_KEY)!.body.toString("utf8"),
    ) as { items: MediaItem[] };
    expect(manifest.items.map((item) => item.id)).toEqual([ID]);
  });

  it("sweeps the captured frames once the poster exists", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());
    await withFrames(store);
    await withRenditions(store);

    await run(store, completed());

    expect(await store.listKeys(framePrefix(ID))).toEqual([]);
  });

  it("clears the renditions left over from an earlier rotation", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting({ rotation: 90 }));
    await withFrames(store, 90);
    await withRenditions(store, 90);
    await store.putObject(
      renditionKey(ID, 0, 480),
      Buffer.from("old"),
      "image/webp",
    );
    await store.putObject(
      videoRenditionKey(ID, 0, 480),
      Buffer.from("old"),
      "video/mp4",
    );

    await run(store, completed(90));

    expect(store.objects.has(renditionKey(ID, 0, 480))).toBe(false);
    expect(store.objects.has(videoRenditionKey(ID, 0, 480))).toBe(false);
    expect(store.objects.has(renditionKey(ID, 90, 480))).toBe(true);
  });

  it("marks a failed transcode, with the reason the client will read", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());

    await run(store, {
      detail: {
        status: "ERROR",
        jobId: JOB,
        userMetadata: { mediaId: ID, rotation: "0" },
        errorMessage: "Unsupported codec.",
      },
    });

    const item = await readItem(store, ID);
    expect(item?.status).toBe("failed");
    expect(item?.error).toBe("Unsupported codec.");
    // Nothing broken reaches the site.
    expect(store.objects.has(MANIFEST_KEY)).toBe(false);
  });

  it("fails rather than publishing a video with no poster", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());
    await withRenditions(store);
    // No frames: the capture output failed even though the MP4s landed.

    await run(store, completed());

    const item = await readItem(store, ID);
    expect(item?.status).toBe("failed");
    expect(item?.error).toMatch(/poster/i);
  });

  it("fails rather than publishing a poster with no video", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());
    await withFrames(store);

    await run(store, {
      detail: {
        status: "COMPLETE",
        jobId: JOB,
        userMetadata: { mediaId: ID, rotation: "0" },
        outputGroupDetails: [],
      },
    });

    expect((await readItem(store, ID))?.status).toBe("failed");
  });

  it("ignores a job the record is no longer waiting on", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting({ jobId: "job-2" }));
    await withFrames(store);

    await run(store, completed(0, "job-1"));

    const item = await readItem(store, ID);
    expect(item?.status).toBe("pending");
    expect(item?.jobId).toBe("job-2");
  });

  it("ignores the progress reports that arrive in between", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());

    await run(store, {
      detail: {
        status: "PROGRESSING",
        jobId: JOB,
        userMetadata: { mediaId: ID, rotation: "0" },
      },
    });

    expect((await readItem(store, ID))?.status).toBe("pending");
  });

  it("gives the renditions a type browsers play and a cache that lasts", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());
    await withFrames(store);
    await withRenditions(store);

    await run(store, completed());

    for (const height of [480, 1080]) {
      const stored = store.objects.get(videoRenditionKey(ID, 0, height));
      expect(stored?.contentType).toBe("video/mp4");
      expect(stored?.cacheControl).toContain("immutable");
    }
  });

  it("refuses to publish renditions it could not label", async () => {
    const store = createMemoryStore();
    await writeItem(store, waiting());
    await withFrames(store);
    // No renditions in the bucket: the self-copy has nothing to copy.

    await run(store, completed());

    const item = await readItem(store, ID);
    expect(item?.status).toBe("failed");
    expect(store.objects.has(MANIFEST_KEY)).toBe(false);
  });

  it("cleans up after a job whose item was deleted mid-flight", async () => {
    const store = createMemoryStore();
    await withFrames(store);
    await withRenditions(store);

    await run(store, completed());

    expect(await store.listKeys(framePrefix(ID))).toEqual([]);
    expect(store.objects.has(itemKey(ID))).toBe(false);
  });
});
