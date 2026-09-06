import {
  MANIFEST_VERSION,
  isReady,
  type Manifest,
  type MediaCategory,
  type MediaItem,
  type ReadyMediaItem,
} from "./media";

/**
 * The one sort order every surface uses: manual `order` ascending, then newest
 * first, then id so the order is total and stable across rebuilds.
 */
export const sortItems = <T extends MediaItem>(items: readonly T[]): T[] =>
  [...items].sort(
    (a, b) =>
      a.order - b.order ||
      b.createdAt.localeCompare(a.createdAt) ||
      a.id.localeCompare(b.id),
  );

export const readyItems = (items: readonly MediaItem[]): ReadyMediaItem[] =>
  items.filter(isReady);

/** The public read model: ready items only, in display order. */
export const buildManifest = (
  items: readonly MediaItem[],
  now: Date,
): Manifest => ({
  version: MANIFEST_VERSION,
  generatedAt: now.toISOString(),
  items: sortItems(readyItems(items)),
});

export const ALL_CATEGORIES = "all";

export type CategoryFilter = MediaCategory | typeof ALL_CATEGORIES;

export const filterByCategory = <T extends MediaItem>(
  items: readonly T[],
  category: CategoryFilter,
): T[] =>
  category === ALL_CATEGORIES
    ? [...items]
    : items.filter((item) => item.category === category);

/**
 * What the home page shows: featured items first in display order, topped up
 * with the newest non-featured ones so the strip is never short while the
 * client is still deciding what to feature.
 */
export const featuredItems = <T extends MediaItem>(
  items: readonly T[],
  limit: number,
): T[] => {
  const sorted = sortItems(items);
  const featured = sorted.filter((item) => item.featured);
  const rest = sorted.filter((item) => !item.featured);
  return [...featured, ...rest].slice(0, Math.max(0, limit));
};

/**
 * Move one item up or down and renumber everything 1..n, so the result is a
 * full set of `{ id, order }` writes and the manual order is explicit for
 * every item from then on (no more ties resolved by upload date).
 */
export const moveItem = (
  items: readonly MediaItem[],
  id: string,
  delta: -1 | 1,
): Array<{ id: string; order: number }> => {
  const sorted = sortItems(items);
  const from = sorted.findIndex((item) => item.id === id);
  if (from === -1) return [];
  const to = Math.min(Math.max(0, from + delta), sorted.length - 1);
  const [moved] = sorted.splice(from, 1);
  sorted.splice(to, 0, moved!);
  return sorted.map((item, index) => ({ id: item.id, order: index + 1 }));
};

/** A readable title from a filename, or "" when the name is camera noise. */
export const titleFromFilename = (filename: string): string => {
  const stem = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  if (
    stem === "" ||
    /^(img|dsc|dcim|image|photo|pxl|screenshot)?[\s\d]*$/i.test(stem)
  )
    return "";
  const words = stem.replace(/\s+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};
