import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { processImage } from "./image";

const png = (width: number, height: number) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 150, b: 100 },
    },
  })
    .png()
    .toBuffer();

const isWebp = (buffer: Buffer): boolean =>
  buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
  buffer.subarray(8, 12).toString("ascii") === "WEBP";

describe("processImage", () => {
  it("renders every width up to the original, as webp", async () => {
    const result = await processImage(await png(1200, 900));
    expect(result.width).toBe(1200);
    expect(result.height).toBe(900);
    expect(result.renditions.map((r) => r.width)).toEqual([480, 960, 1200]);
    for (const rendition of result.renditions) {
      expect(isWebp(rendition.body)).toBe(true);
      const meta = await sharp(rendition.body).metadata();
      expect(meta.width).toBe(rendition.width);
    }
    expect(result.placeholder.startsWith("data:image/webp;base64,")).toBe(true);
  });

  it("does not upscale a small image", async () => {
    const result = await processImage(await png(300, 200));
    expect(result.renditions.map((r) => r.width)).toEqual([300]);
  });

  it("honours EXIF orientation when reporting size", async () => {
    const sideways = await sharp(await png(1000, 500))
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const result = await processImage(sideways);
    expect(result.width).toBe(500);
    expect(result.height).toBe(1000);
    expect(result.renditions.map((r) => r.width)).toEqual([480, 500]);
  });

  it("rejects something that is not an image", async () => {
    await expect(processImage(Buffer.from("hello, world"))).rejects.toThrow(
      /Not a readable image/,
    );
  });
});
