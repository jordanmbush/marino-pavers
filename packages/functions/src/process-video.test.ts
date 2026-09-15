import {
  MAX_VIDEO_BYTES,
  itemKey,
  originalKey,
  type MediaItem,
} from "@marino/domain";
import type { S3Event, S3EventRecord } from "aws-lambda";
import { describe, expect, it } from "vitest";
import { readItem, writeItem } from "./lib/items";
import { silentLogger } from "./lib/logger";
import { createMemoryStore, type MemoryStore } from "./lib/memory-store";
import type { Transcoder, TranscodeRequest } from "./lib/transcode";
import { createProcessVideoHandler } from "./process-video";

const ID = "0123456789abcdef";

/** Only the fields the handler reads; the rest of an S3 record is noise here. */
const record = (key: string, size = 1_000): S3EventRecord =>
  ({
    s3: {
      bucket: { name: "media" },
      object: { key: encodeURIComponent(key), size },
    },
  }) as S3EventRecord;

const event = (key: string, size?: number): S3Event => ({
  Records: [record(key, size)],
});

const fakeTranscoder = () => {
  const submitted: TranscodeRequest[] = [];
  let next = 1;
  const transcoder: Transcoder = {
    async submit(request) {
      submitted.push(request);
      return `job-${next++}`;
    },
  };
  return { transcoder, submitted };
};

const pending = (overrides: Partial<MediaItem> = {}): MediaItem => ({
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
  original: {
    key: originalKey(ID, "mp4"),
    contentType: "video/mp4",
    bytes: 1_000,
  },
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
  ...overrides,
});

const run = async (store: MemoryStore, e: S3Event, transcoder: Transcoder) =>
  createProcessVideoHandler({
    store,
    transcoder,
    now: () => new Date("2026-09-14T00:00:00.000Z"),
    logger: silentLogger,
  })(e);

describe("process-video", () => {
  it("hands the original to the transcoder without reading it", async () => {
    const store = createMemoryStore();
    const key = originalKey(ID, "mp4");
    await writeItem(store, pending());
    const { transcoder, submitted } = fakeTranscoder();

    await run(store, event(key), transcoder);

    expect(submitted).toEqual([{ id: ID, rotation: 0, inputKey: key }]);
    // No object was ever fetched: a 200 MB file must not pass through Lambda.
    expect(store.objects.has(key)).toBe(false);
  });

  it("records the job it is waiting on, and stays pending", async () => {
    const store = createMemoryStore();
    await writeItem(store, pending());
    const { transcoder } = fakeTranscoder();

    await run(store, event(originalKey(ID, "mp4")), transcoder);

    const item = await readItem(store, ID);
    expect(item?.status).toBe("pending");
    expect(item?.kind).toBe("video");
    expect(item?.jobId).toBe("job-1");
    expect(item?.updatedAt).toBe("2026-09-14T00:00:00.000Z");
  });

  it("keeps what the client typed", async () => {
    const store = createMemoryStore();
    await writeItem(store, pending());
    const { transcoder } = fakeTranscoder();

    await run(store, event(originalKey(ID, "mp4")), transcoder);

    const item = await readItem(store, ID);
    expect(item?.title).toBe("Desert Ridge patio");
    expect(item?.category).toBe("pool-decks");
    expect(item?.city).toBe("Phoenix");
  });

  it("transcodes at the rotation the record asks for", async () => {
    const store = createMemoryStore();
    await writeItem(store, pending({ rotation: 90 }));
    const { transcoder, submitted } = fakeTranscoder();

    await run(store, event(originalKey(ID, "mp4")), transcoder);

    expect(submitted[0]?.rotation).toBe(90);
  });

  it("drops the previous renditions so a re-run can't look ready", async () => {
    const store = createMemoryStore();
    await writeItem(
      store,
      pending({
        status: "ready",
        rotation: 90,
        image: { width: 1, height: 1, widths: [480], placeholder: "data:," },
        video: {
          width: 1920,
          height: 1080,
          heights: [480],
          durationSeconds: 3,
        },
        error: "an old failure",
      }),
    );
    const { transcoder } = fakeTranscoder();

    await run(store, event(originalKey(ID, "mp4")), transcoder);

    const item = await readItem(store, ID);
    expect(item?.status).toBe("pending");
    expect(item?.image).toBeUndefined();
    expect(item?.video).toBeUndefined();
    expect(item?.error).toBeUndefined();
  });

  it("invents a record for a file dropped straight into the bucket", async () => {
    const store = createMemoryStore();
    const { transcoder } = fakeTranscoder();

    await run(store, event(originalKey(ID, "mov")), transcoder);

    const item = await readItem(store, ID);
    expect(item?.kind).toBe("video");
    expect(item?.original.contentType).toBe("video/quicktime");
    expect(item?.category).toBe("patios");
  });

  it("throws away an original bigger than the limit, record and all", async () => {
    const store = createMemoryStore();
    const key = originalKey(ID, "mp4");
    await store.putObject(key, Buffer.from("x"), "video/mp4");
    await writeItem(store, pending());
    const { transcoder, submitted } = fakeTranscoder();

    await run(store, event(key, MAX_VIDEO_BYTES + 1), transcoder);

    expect(submitted).toEqual([]);
    expect(store.objects.has(key)).toBe(false);
    expect(store.objects.has(itemKey(ID))).toBe(false);
  });

  it("leaves photos to the other handler", async () => {
    const store = createMemoryStore();
    const { transcoder, submitted } = fakeTranscoder();

    await run(store, event(originalKey(ID, "jpg")), transcoder);

    expect(submitted).toEqual([]);
    expect(await readItem(store, ID)).toBeNull();
  });

  it("survives a transcoder that refuses the job", async () => {
    const store = createMemoryStore();
    await writeItem(store, pending());
    const failing: Transcoder = {
      submit: () => Promise.reject(new Error("quota exceeded")),
    };

    await expect(
      run(store, event(originalKey(ID, "mp4")), failing),
    ).resolves.toBeUndefined();
    // The record is untouched, so a retry can still find it.
    expect((await readItem(store, ID))?.status).toBe("pending");
  });
});
