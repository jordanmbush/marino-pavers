import { describe, expect, it } from "vitest";
import { createUploadRequestSchema } from "./admin-api";
import {
  frameSetPrefix,
  parseOriginalKey,
  parseVideoRenditionHeight,
  videoDestinationPrefix,
  videoRenditionKey,
} from "./keys";
import {
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_BYTES,
  isReady,
  isVideo,
  kindForUploadType,
  maxBytesFor,
  mediaItemSchema,
  type MediaItem,
  type ReadyVideoItem,
} from "./media";
import { buildManifest } from "./manifest";
import { pickVideoHeight, videoUrl } from "./renditions";

const ID = "0123456789abcdef";

const stored = {
  id: ID,
  status: "ready",
  kind: "video",
  title: "Casa Ortega",
  category: "patios",
  city: "Phoenix",
  detail: "",
  featured: false,
  order: 0,
  rotation: 0,
  original: { key: "originals/x.mp4", contentType: "video/mp4", bytes: 1 },
  image: {
    width: 1600,
    height: 900,
    widths: [480, 960],
    placeholder: "data:,",
  },
  video: {
    width: 1920,
    height: 1080,
    heights: [480, 1080],
    durationSeconds: 9,
  },
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
};

const video = mediaItemSchema.parse(stored) as ReadyVideoItem;

describe("kinds", () => {
  it("routes each accepted type to the pipeline that can handle it", () => {
    expect(kindForUploadType("image/jpeg")).toBe("photo");
    expect(kindForUploadType("image/webp")).toBe("photo");
    expect(kindForUploadType("video/mp4")).toBe("video");
    expect(kindForUploadType("video/quicktime")).toBe("video");
  });

  it("gives video its own, much larger size limit", () => {
    expect(maxBytesFor("photo")).toBe(MAX_UPLOAD_BYTES);
    expect(maxBytesFor("video")).toBe(MAX_VIDEO_BYTES);
    expect(MAX_VIDEO_BYTES).toBeGreaterThan(MAX_UPLOAD_BYTES);
  });

  it("reads a record written before videos existed as a photo", () => {
    const old: Record<string, unknown> = { ...stored };
    delete old.kind;
    delete old.video;
    expect(mediaItemSchema.parse(old).kind).toBe("photo");
  });
});

describe("readiness", () => {
  it("wants both halves of a video before the site may show it", () => {
    expect(isReady(video)).toBe(true);
    expect(isReady({ ...video, video: undefined })).toBe(false);
    expect(isReady({ ...video, image: undefined })).toBe(false);
  });

  it("still asks a photo only for its image", () => {
    const photo: MediaItem = { ...video, kind: "photo", video: undefined };
    expect(isReady(photo)).toBe(true);
  });

  it("narrows a ready item to a video only when it is one", () => {
    expect(isVideo(video)).toBe(true);
    expect(isVideo({ ...video, kind: "photo" })).toBe(false);
  });

  it("keeps a half-transcoded video out of the manifest", () => {
    const half: MediaItem = { ...video, video: undefined };
    const manifest = buildManifest([half, video], new Date(0));
    expect(manifest.items.map((item) => item.id)).toEqual([ID]);
  });
});

describe("video keys", () => {
  it("names a rendition by its height, under the rotation that made it", () => {
    expect(videoRenditionKey(ID, 0, 480)).toBe(`renditions/${ID}/r0/v480.mp4`);
    expect(videoRenditionKey(ID, 90, 1080)).toBe(
      `renditions/${ID}/r90/v1080.mp4`,
    );
  });

  it("round-trips the height a rendition key encodes", () => {
    expect(parseVideoRenditionHeight(videoRenditionKey(ID, 0, 1080))).toBe(
      1080,
    );
    expect(
      parseVideoRenditionHeight(`renditions/${ID}/r0/480.webp`),
    ).toBeNull();
    expect(parseVideoRenditionHeight("manifest.json")).toBeNull();
  });

  it("builds a destination the transcoder's name modifier completes", () => {
    expect(`${videoDestinationPrefix(ID, 0)}480.mp4`).toBe(
      videoRenditionKey(ID, 0, 480),
    );
  });

  it("keeps captured frames out of the published prefix", () => {
    expect(frameSetPrefix(ID, 0).startsWith("renditions/")).toBe(false);
    expect(frameSetPrefix(ID, 0)).toBe(`frames/${ID}/r0/frame`);
  });

  it("reads a video original the same way it reads a photo's", () => {
    expect(parseOriginalKey(`originals/${ID}.mp4`)).toEqual({
      id: ID,
      ext: "mp4",
    });
  });
});

describe("picking a rendition", () => {
  it("gives each surface the largest rendition it asked for", () => {
    expect(pickVideoHeight(video, 480)).toBe(480);
    expect(pickVideoHeight(video, 1080)).toBe(1080);
  });

  it("never hands back one bigger than was wanted", () => {
    expect(pickVideoHeight(video, 720)).toBe(480);
  });

  it("falls back to the smallest when nothing is small enough", () => {
    const tall = { ...video, video: { ...video.video, heights: [1080] } };
    expect(pickVideoHeight(tall, 480)).toBe(1080);
  });

  it("builds a URL on the media base, trailing slash or not", () => {
    expect(videoUrl("/media", video, 480)).toBe(
      `/media/renditions/${ID}/r0/v480.mp4`,
    );
    expect(videoUrl("https://cdn.test/media/", video, 1080)).toBe(
      `https://cdn.test/media/renditions/${ID}/r0/v1080.mp4`,
    );
  });
});

describe("the upload request", () => {
  const base = { filename: "clip.mp4", category: "patios" as const };

  it("lets a video be far bigger than a photo", () => {
    expect(
      createUploadRequestSchema.safeParse({
        ...base,
        contentType: "video/mp4",
        bytes: MAX_UPLOAD_BYTES + 1,
      }).success,
    ).toBe(true);
  });

  it("still holds a photo to the photo limit", () => {
    const parsed = createUploadRequestSchema.safeParse({
      ...base,
      filename: "patio.jpg",
      contentType: "image/jpeg",
      bytes: MAX_UPLOAD_BYTES + 1,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(["bytes"]);
  });

  it("refuses a video over the video limit", () => {
    expect(
      createUploadRequestSchema.safeParse({
        ...base,
        contentType: "video/mp4",
        bytes: MAX_VIDEO_BYTES + 1,
      }).success,
    ).toBe(false);
  });

  it("refuses a type neither pipeline handles", () => {
    expect(
      createUploadRequestSchema.safeParse({
        ...base,
        contentType: "video/avi",
        bytes: 10,
      }).success,
    ).toBe(false);
  });
});
