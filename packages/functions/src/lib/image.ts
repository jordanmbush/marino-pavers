import {
  PLACEHOLDER_WIDTH,
  pickRenditionWidths,
  type Rotation,
} from "@marino/domain";
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
 * One original in, every rendition out. The image is first turned the way
 * its EXIF tag says, then a further `rotation` clockwise — the client's
 * correction on top of the camera's — and only then resized, so a portrait
 * result is resized by its displayed width. Metadata is stripped by default;
 * only the first frame of an animated or multi-page input is used.
 */
export const processImage = async (
  input: Buffer,
  rotation: Rotation = 0,
): Promise<ProcessedImage> => {
  // sharp allows one angled rotate per pipeline, plus the bare EXIF one.
  const oriented = sharp(input, { animated: false, pages: 1 }).rotate();
  const source = rotation === 0 ? oriented : oriented.rotate(rotation);

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
  // Each quarter turn swaps the axes; two swaps (EXIF sideways plus a 90°
  // correction) put them back.
  const swapped =
    isSideways(stored.orientation) !== (rotation === 90 || rotation === 270);
  const width = swapped ? stored.height : stored.width;
  const height = swapped ? stored.width : stored.height;

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
