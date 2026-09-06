import {
  ACCEPTED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  parseOriginalKey,
  renditionKey,
  titleFromFilename,
  type AcceptedUploadType,
  type MediaItem,
} from "@marino/domain";
import type { S3Event } from "aws-lambda";
import sharp from "sharp";
import { processImage } from "./lib/image";
import {
  deleteItemAndDerived,
  deleteStaleRenditions,
  readItem,
  rebuildManifest,
  writeItem,
} from "./lib/items";
import { consoleLogger, type Logger } from "./lib/logger";
import { createS3Store, type ObjectStore } from "./lib/s3";

export type ProcessImageDeps = {
  store: ObjectStore;
  now?: () => Date;
  logger?: Logger;
};

/** Renditions never change once written, so the CDN may keep them forever. */
const RENDITION_CACHE = "public, max-age=31536000, immutable";

/** S3 event keys are URL-encoded, with spaces as `+`. */
const decodeKey = (key: string): string =>
  decodeURIComponent(key.replaceAll("+", " "));

const EXTENSION_TYPES: Record<string, AcceptedUploadType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const isAcceptedType = (
  value: string | undefined,
): value is AcceptedUploadType =>
  value !== undefined && value in ACCEPTED_UPLOAD_TYPES;

/**
 * Only reached for an object that arrived without going through the admin
 * API (say, dropped into the bucket by hand), so there is no pending record
 * to merge into and the type has to be inferred.
 */
const contentTypeFor = (
  stored: string | undefined,
  ext: string,
): AcceptedUploadType =>
  isAcceptedType(stored) ? stored : (EXTENSION_TYPES[ext] ?? "image/jpeg");

const processOne = async (
  key: string,
  { store, now, logger }: Required<ProcessImageDeps>,
): Promise<void> => {
  const parsed = parseOriginalKey(key);
  if (!parsed) {
    logger.info("ignoring object outside originals/", { key });
    return;
  }
  const { id, ext } = parsed;

  const original = await store.getObject(key);
  if (!original) {
    logger.warn("original vanished before processing", { key });
    return;
  }

  if (original.body.length > MAX_UPLOAD_BYTES) {
    logger.error("original exceeds the upload limit; discarding", {
      key,
      bytes: original.body.length,
    });
    await store.deleteObject(key);
    await deleteItemAndDerived(store, id);
    return;
  }

  // The record comes first: it carries the rotation the client asked for.
  // An original that is written again (see `touchObject`) lands here too,
  // and gets a fresh set of renditions at whatever the record says now.
  const existing = await readItem(store, id, logger);
  const rotation = existing?.rotation ?? 0;

  const processed = await processImage(original.body, rotation);
  await Promise.all(
    processed.renditions.map((rendition) =>
      store.putObject(
        renditionKey(id, rotation, rendition.width),
        rendition.body,
        "image/webp",
        RENDITION_CACHE,
      ),
    ),
  );

  const at = now().toISOString();
  const item: MediaItem = {
    ...(existing ?? {
      id,
      title: titleFromFilename(key.slice(key.lastIndexOf("/") + 1)),
      category: "patios",
      city: "",
      detail: "",
      featured: false,
      order: 0,
      rotation,
      original: {
        key,
        contentType: contentTypeFor(original.contentType, ext),
        bytes: original.body.length,
      },
      createdAt: at,
    }),
    status: "ready",
    image: {
      width: processed.width,
      height: processed.height,
      widths: processed.renditions.map((rendition) => rendition.width),
      placeholder: processed.placeholder,
    },
    updatedAt: at,
  };
  await writeItem(store, item);
  await rebuildManifest(store, now(), logger);
  await deleteStaleRenditions(store, id, rotation);
  logger.info("processed", { id, rotation, widths: item.image?.widths });
};

export const createProcessImageHandler = ({
  store,
  now = () => new Date(),
  logger = consoleLogger,
}: ProcessImageDeps) => {
  const deps = { store, now, logger };
  return async (event: S3Event): Promise<void> => {
    // Sequential on purpose: renditions of one photo already use every core,
    // and a failure must not take the other records in the batch with it.
    for (const record of event.Records) {
      const key = decodeKey(record.s3.object.key);
      try {
        await processOne(key, deps);
      } catch (error) {
        logger.error("failed to process original", { key, error });
      }
    }
  };
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
};

let wired: ReturnType<typeof createProcessImageHandler> | undefined;

export const handler = (event: S3Event): Promise<void> => {
  if (!wired) {
    // One image at a time inside libvips; the Lambda is already sized to it.
    sharp.concurrency(1);
    wired = createProcessImageHandler({
      store: createS3Store(requireEnv("MEDIA_BUCKET")),
    });
  }
  return wired(event);
};
