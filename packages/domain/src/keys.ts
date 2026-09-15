import {
  ACCEPTED_UPLOAD_TYPES,
  type AcceptedUploadType,
  type Rotation,
} from "./media";

/**
 * Where things live in the media bucket. Three prefixes, one file:
 *
 *   originals/{id}.{ext}                 what the client uploaded, untouched
 *   renditions/{id}/r{rotation}/{w}.webp  the stills the site serves
 *   renditions/{id}/r{rotation}/v{h}.mp4  the video the site plays
 *   frames/{id}/r{rotation}/frame*       frames the transcoder captured, transient
 *   items/{id}.json                      one record per item — the source of truth
 *   manifest.json                        the public read model, rebuilt from items/
 *
 * Renditions are cached as immutable for a year, so a rendition key must
 * never get new bytes. Rotating a photo therefore writes a fresh set under
 * its own `r{rotation}` prefix; the stale set is removed once the item
 * points at the new one. Video sits under that same prefix and inherits all
 * of it: one public route serves both, one rotation busts both caches, and
 * `deleteStaleRenditions` sweeps both without knowing video exists.
 */

export const ORIGINALS_PREFIX = "originals/";
export const RENDITIONS_PREFIX = "renditions/";
export const FRAMES_PREFIX = "frames/";
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

/** One transcoded MP4, named by its height so 480 and 1080 can't collide. */
export const videoRenditionKey = (
  id: string,
  rotation: Rotation,
  height: number,
): string => `${renditionSetPrefix(id, rotation)}v${height}.mp4`;

const VIDEO_RENDITION_KEY = /\/v(\d+)\.mp4$/;

/** The height a video rendition key encodes, or null for any other key. */
export const parseVideoRenditionHeight = (key: string): number | null => {
  const match = VIDEO_RENDITION_KEY.exec(key);
  return match ? Number(match[1]) : null;
};

/** Every captured frame of one item, whichever rotation it was captured at. */
export const framePrefix = (id: string): string => `${FRAMES_PREFIX}${id}/`;

/**
 * Where the transcoder is told to put the captured frames. MediaConvert
 * appends its own frame number and extension to a destination, so this is a
 * prefix rather than a key — `frame.0000001.jpg` is what lands.
 *
 * Deliberately outside `renditions/`: the Router publishes that prefix, and
 * these JPEGs are scaffolding. They are read once to build the poster
 * renditions and deleted in the same breath, so they are never served.
 */
export const frameSetPrefix = (id: string, rotation: Rotation): string =>
  `${framePrefix(id)}r${rotation}/frame`;

/**
 * Where the MP4s are told to go. Same story: MediaConvert builds a key by
 * appending each output's name modifier to the destination, so asking for
 * `…/r0/v` with a modifier of `480` is what produces `videoRenditionKey`.
 */
export const videoDestinationPrefix = (
  id: string,
  rotation: Rotation,
): string => `${renditionSetPrefix(id, rotation)}v`;

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
