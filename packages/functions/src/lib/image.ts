import { PLACEHOLDER_WIDTH, pickRenditionWidths } from "@marino/domain";
import sharp from "sharp";

export type Rendition = { width: number; body: Buffer };

export type ProcessedImage = {
  width: number;
  height: number;
  renditions: Rendition[];
  placeholder: string;
};

const WEBP = { quality: 82, effort: 4 } as const;
const PLACEHOLDER_WEBP = { quality: 40, effort: 4 } as const;

/** EXIF orientations 5–8 rotate by 90°, swapping the stored width and height. */
const isSideways = (orientation: number | undefined): boolean =>
  orientation !== undefined && orientation >= 5;

/**
 * One original in, every rendition out. Rotation follows the EXIF tag and
 * happens before resizing, so a portrait phone photo is resized by its
 * displayed width. Metadata is stripped by default; only the first frame of
 * an animated or multi-page input is used.
 */
export const processImage = async (input: Buffer): Promise<ProcessedImage> => {
  const source = sharp(input, { animated: false, pages: 1 }).rotate();

  let stored: { width?: number; height?: number; orientation?: number };
  try {
    stored = await source.metadata();
  } catch (error) {
    throw new Error(
      `Not a readable image: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  if (!stored.width || !stored.height) {
    throw new Error("Image has no dimensions");
  }
  const sideways = isSideways(stored.orientation);
  const width = sideways ? stored.height : stored.width;
  const height = sideways ? stored.width : stored.height;

  const renditions = await Promise.all(
    pickRenditionWidths(width).map(async (target) => ({
      width: target,
      body: await source
        .clone()
        .resize({ width: target, withoutEnlargement: true })
        .webp(WEBP)
        .toBuffer(),
    })),
  );

  const placeholder = await source
    .clone()
    .resize({ width: PLACEHOLDER_WIDTH, withoutEnlargement: true })
    .webp(PLACEHOLDER_WEBP)
    .toBuffer();

  return {
    width,
    height,
    renditions,
    placeholder: `data:image/webp;base64,${placeholder.toString("base64")}`,
  };
};
