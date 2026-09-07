/**
 * The icons content is allowed to name. The kit's `Icon` component maps every
 * one of these to a Lucide glyph, and the `satisfies` there means adding a
 * name here without adding the glyph is a compile error, not a blank spot.
 */
export const ICON_NAMES = [
  "layout-grid",
  "car",
  "sprout",
  "waves",
  "footprints",
  "flame",
  "clipboard-list",
  "pencil-ruler",
  "layers",
  "hammer",
  "shield-check",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
