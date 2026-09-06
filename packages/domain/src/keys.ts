import {
  ACCEPTED_UPLOAD_TYPES,
  type AcceptedUploadType,
  type Rotation,
} from "./media";

/**
 * Where things live in the media bucket. Three prefixes, one file:
 *
 *   originals/{id}.{ext}                what the client uploaded, untouched
 *   renditions/{id}/r{rotation}/{w}.webp what the site serves
 *   items/{id}.json                     one record per photo — the source of truth
 *   manifest.json                       the public read model, rebuilt from items/
 *
 * Renditions are cached as immutable for a year, so a rendition key must
 * never get new bytes. Rotating a photo therefore writes a fresh set under
 * its own `r{rotation}` prefix; the stale set is removed once the item
 * points at the new one.
 */

export const ORIGINALS_PREFIX = "originals/";
export const RENDITIONS_PREFIX = "renditions/";
export const ITEMS_PREFIX = "items/";
export const MANIFEST_KEY = "manifest.json";

export const extensionFor = (contentType: AcceptedUploadType): string =>
  ACCEPTED_UPLOAD_TYPES[contentType];

export const originalKey = (id: string, ext: string): string =>
  `${ORIGINALS_PREFIX}${id}.${ext}`;

/** Every rendition of one photo, whichever rotation they were made at. */
export const renditionPrefix = (id: string): string =>
  `${RENDITIONS_PREFIX}${id}/`;

/** The set of renditions made at one rotation. */
export const renditionSetPrefix = (id: string, rotation: Rotation): string =>
  `${renditionPrefix(id)}r${rotation}/`;

export const renditionKey = (
  id: string,
  rotation: Rotation,
  width: number,
): string => `${renditionSetPrefix(id, rotation)}${width}.webp`;

export const itemKey = (id: string): string => `${ITEMS_PREFIX}${id}.json`;

const ORIGINAL_KEY = /^originals\/([a-f0-9]{16})\.([a-z0-9]+)$/;

/** The id and extension an originals key encodes, or null for any other key. */
export const parseOriginalKey = (
  key: string,
): { id: string; ext: string } | null => {
  const match = ORIGINAL_KEY.exec(key);
  return match ? { id: match[1]!, ext: match[2]! } : null;
};

const ITEM_KEY = /^items\/([a-f0-9]{16})\.json$/;

export const parseItemKey = (key: string): string | null =>
  ITEM_KEY.exec(key)?.[1] ?? null;
