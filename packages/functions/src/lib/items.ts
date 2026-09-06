import {
  ITEMS_PREFIX,
  MANIFEST_KEY,
  ORIGINALS_PREFIX,
  buildManifest,
  itemKey,
  mediaItemSchema,
  parseItemKey,
  renditionPrefix,
  renditionSetPrefix,
  type Manifest,
  type MediaItem,
  type Rotation,
} from "@marino/domain";
import { consoleLogger, type Logger } from "./logger";
import type { ObjectStore } from "./s3";

const JSON_TYPE = "application/json";

/** Parsed and validated, or null for a missing or unreadable record. */
export const readItem = async (
  store: ObjectStore,
  id: string,
  logger: Logger = consoleLogger,
): Promise<MediaItem | null> => {
  const object = await store.getObject(itemKey(id));
  if (!object) return null;
  try {
    const parsed = mediaItemSchema.safeParse(
      JSON.parse(object.body.toString("utf8")),
    );
    if (parsed.success) return parsed.data;
    logger.warn("item record failed validation", {
      id,
      issues: parsed.error.issues,
    });
  } catch (error) {
    logger.warn("item record is not JSON", { id, error });
  }
  return null;
};

export const writeItem = async (
  store: ObjectStore,
  item: MediaItem,
): Promise<void> => {
  await store.putObject(
    itemKey(item.id),
    JSON.stringify(item),
    JSON_TYPE,
    "no-store",
  );
};

export const listItems = async (
  store: ObjectStore,
  logger: Logger = consoleLogger,
): Promise<MediaItem[]> => {
  const keys = await store.listKeys(ITEMS_PREFIX);
  const ids = keys.map(parseItemKey).filter((id): id is string => id !== null);
  const items = await Promise.all(ids.map((id) => readItem(store, id, logger)));
  return items.filter((item): item is MediaItem => item !== null);
};

/**
 * Removes the record, every rendition and the original. Works without the
 * record: the original is found by prefix (`originals/{id}.`) rather than by
 * reading `original.key`, so a half-written item can still be cleaned up.
 */
export const deleteItemAndDerived = async (
  store: ObjectStore,
  id: string,
): Promise<void> => {
  await store.deleteObject(itemKey(id));
  await store.deleteByPrefix(renditionPrefix(id));
  await store.deleteByPrefix(`${ORIGINALS_PREFIX}${id}.`);
};

/**
 * Removes every rendition of a photo except the set made at `keep`. Called
 * after the item points at the new set, so nothing the manifest names is
 * ever missing.
 */
export const deleteStaleRenditions = async (
  store: ObjectStore,
  id: string,
  keep: Rotation,
): Promise<void> => {
  const current = renditionSetPrefix(id, keep);
  const stale = (await store.listKeys(renditionPrefix(id))).filter(
    (key) => !key.startsWith(current),
  );
  for (const key of stale) await store.deleteObject(key);
};

/**
 * Sixty seconds of CDN cache is the trade between "a new photo shows up
 * within a minute" and "the manifest is not re-read from S3 on every visit".
 */
const MANIFEST_CACHE = "public, max-age=60, must-revalidate";

export const rebuildManifest = async (
  store: ObjectStore,
  now: Date = new Date(),
  logger: Logger = consoleLogger,
): Promise<Manifest> => {
  const manifest = buildManifest(await listItems(store, logger), now);
  await store.putObject(
    MANIFEST_KEY,
    JSON.stringify(manifest),
    JSON_TYPE,
    MANIFEST_CACHE,
  );
  return manifest;
};
