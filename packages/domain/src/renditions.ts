import { renditionKey } from "./keys";
import { RENDITION_WIDTHS, type ReadyMediaItem } from "./media";

/**
 * Which widths to render for an original, ascending. Never upscales: every
 * standard width smaller than the original, then the original itself capped
 * at the largest standard width. So a 1200px photo gets 480, 960 and 1200; a
 * 4000px photo gets all four standard widths; a 400px photo gets just 400.
 */
export const pickRenditionWidths = (originalWidth: number): number[] => {
  const cap = RENDITION_WIDTHS[RENDITION_WIDTHS.length - 1]!;
  const largest = Math.min(Math.max(1, Math.round(originalWidth)), cap);
  const smaller = RENDITION_WIDTHS.filter((w) => w < largest);
  return [...smaller, largest];
};

/** Absolute or root-relative URL of one rendition, given the media base. */
export const renditionUrl = (
  mediaBase: string,
  id: string,
  width: number,
): string => `${mediaBase.replace(/\/$/, "")}/${renditionKey(id, width)}`;

export const largestWidth = (item: ReadyMediaItem): number =>
  item.image.widths[item.image.widths.length - 1]!;

/** The `srcset` attribute for an item: every rendition with its width descriptor. */
export const srcSet = (mediaBase: string, item: ReadyMediaItem): string =>
  item.image.widths
    .map((w) => `${renditionUrl(mediaBase, item.id, w)} ${w}w`)
    .join(", ");

/** The default `src`: the largest rendition, for browsers that ignore srcset. */
export const fallbackSrc = (mediaBase: string, item: ReadyMediaItem): string =>
  renditionUrl(mediaBase, item.id, largestWidth(item));

/**
 * `sizes` strings for the layouts the site uses. Named here so the gallery
 * grid and the home-page strip agree with the CSS that lays them out.
 */
export const SIZES = {
  /** Three across on desktop, two on tablet, one on a phone. */
  gridThird: "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw",
  /** The lightbox: most of the viewport. */
  lightbox: "(min-width: 1024px) 80vw, 100vw",
  /** A small square thumbnail in the admin list. */
  thumb: "160px",
} as const;
