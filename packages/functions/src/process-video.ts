import {
  MAX_VIDEO_BYTES,
  isVideoType,
  parseOriginalKey,
  titleFromFilename,
  type AcceptedVideoType,
  type MediaItem,
} from "@marino/domain";
import type { S3Event } from "aws-lambda";
import {
  deleteItemAndDerived,
  readItem,
  rebuildManifest,
  writeItem,
} from "./lib/items";
import { consoleLogger, type Logger } from "./lib/logger";
import { createS3Store, type ObjectStore } from "./lib/s3";
import { createMediaConvertTranscoder, type Transcoder } from "./lib/transcode";

/**
 * The video half of the pipeline, and the mirror image of `process-image`.
 *
 * Where the image processor does the work itself, this one only hands it
 * off: MediaConvert reads the original straight out of the bucket, so the
 * Lambda never downloads a 200 MB file and finishes in well under a second.
 * The item stays `pending` until the job reports back — see `video-complete`.
 */

export type ProcessVideoDeps = {
  store: ObjectStore;
  transcoder: Transcoder;
  now?: () => Date;
  logger?: Logger;
};

const EXTENSION_TYPES: Record<string, AcceptedVideoType> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  qt: "video/quicktime",
};

/** S3 event keys are URL-encoded, with spaces as `+`. */
const decodeKey = (key: string): string =>
  decodeURIComponent(key.replaceAll("+", " "));

/**
 * Only reached for an object that arrived without going through the admin
 * API, so there is no pending record to merge into and the type has to come
 * from the extension.
 */
const contentTypeFor = (
  stored: string | undefined,
  ext: string,
): AcceptedVideoType =>
  stored !== undefined && isVideoType(stored)
    ? stored
    : (EXTENSION_TYPES[ext] ?? "video/mp4");

const processOne = async (
  key: string,
  bytes: number,
  { store, transcoder, now, logger }: Required<ProcessVideoDeps>,
): Promise<void> => {
  const parsed = parseOriginalKey(key);
  if (!parsed) {
    logger.info("ignoring object outside originals/", { key });
    return;
  }
  const { id, ext } = parsed;
  if (!(ext in EXTENSION_TYPES)) {
    logger.info("ignoring non-video original", { key });
    return;
  }

  // The notification filter should keep an oversized file out of here, but
  // the size is only ever checked against a promise the browser made. This
  // is the first look at the real object.
  if (bytes > MAX_VIDEO_BYTES) {
    logger.error("original exceeds the upload limit; discarding", {
      key,
      bytes,
    });
    await store.deleteObject(key);
    await deleteItemAndDerived(store, id);
    await rebuildManifest(store, now(), logger);
    return;
  }

  // The record comes first: it carries the rotation the client asked for.
  // An original written again (see `touchObject`) lands here too, and gets a
  // fresh job at whatever the record says now.
  const existing = await readItem(store, id, logger);
  const rotation = existing?.rotation ?? 0;

  const jobId = await transcoder.submit({ id, rotation, inputKey: key });

  const at = now().toISOString();
  const item: MediaItem = {
    ...(existing ?? {
      id,
      kind: "video",
      title: titleFromFilename(key.slice(key.lastIndexOf("/") + 1)),
      category: "patios",
      city: "",
      detail: "",
      featured: false,
      order: 0,
      rotation,
      original: {
        key,
        contentType: contentTypeFor(undefined, ext),
        bytes,
      },
      createdAt: at,
    }),
    kind: "video",
    status: "pending",
    jobId,
    updatedAt: at,
  };
  // Whatever the previous run produced describes the old rotation. Dropping
  // both halves now is what keeps a half-updated item out of the manifest:
  // `isReady` wants the poster and the MP4, and neither is true again until
  // the job reports back.
  delete item.image;
  delete item.video;
  delete item.error;

  await writeItem(store, item);
  logger.info("submitted transcode", { id, rotation, jobId, bytes });
};

export const createProcessVideoHandler = ({
  store,
  transcoder,
  now = () => new Date(),
  logger = consoleLogger,
}: ProcessVideoDeps) => {
  const deps = { store, transcoder, now, logger };
  return async (event: S3Event): Promise<void> => {
    for (const record of event.Records) {
      const key = decodeKey(record.s3.object.key);
      try {
        await processOne(key, record.s3.object.size, deps);
      } catch (error) {
        logger.error("failed to submit transcode", { key, error });
      }
    }
  };
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
};

let wired: ReturnType<typeof createProcessVideoHandler> | undefined;

export const handler = (event: S3Event): Promise<void> => {
  wired ??= createProcessVideoHandler({
    store: createS3Store(requireEnv("MEDIA_BUCKET")),
    transcoder: createMediaConvertTranscoder({
      bucket: requireEnv("MEDIA_BUCKET"),
      roleArn: requireEnv("MEDIACONVERT_ROLE_ARN"),
      stage: requireEnv("STAGE"),
      queueArn: process.env.MEDIACONVERT_QUEUE_ARN || undefined,
    }),
  });
  return wired(event);
};
