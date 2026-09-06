import { MEDIA_ID_PATTERN } from "./media";

/**
 * Sixteen hex characters from a UUID. Short enough to read in a key, random
 * enough that two uploads can never collide, and free of anything a client
 * might want to change later (a title is metadata, not identity).
 */
export const newMediaId = (): string =>
  crypto.randomUUID().replaceAll("-", "").slice(0, 16);

export const isMediaId = (value: string): boolean =>
  MEDIA_ID_PATTERN.test(value);
