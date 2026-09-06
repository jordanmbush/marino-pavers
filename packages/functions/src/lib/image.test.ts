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

/** Left half red, right half blue: enough to tell which way it was turned. */
const halves = (width: number, height: number) => {
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      raw[(y * width + x) * 3 + (x < width / 2 ? 0 : 2)] = 255;
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
};

const pixel = async (webp: Buffer, x: number, y: number) => {
  const { data, info } = await sharp(webp)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (y * info.width + x) * info.channels;
  return data[at]! > data[at + 2]! ? "red" : "blue";
};

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

  it("turns the image clockwise by the requested quarter turns", async () => {
    const result = await processImage(await halves(400, 200), 90);
    expect(result.width).toBe(200);
    expect(result.height).toBe(400);
    expect(result.renditions.map((r) => r.width)).toEqual([200]);
    // Clockwise: the left (red) edge becomes the top edge.
    const body = result.renditions[0]!.body;
    expect(await pixel(body, 100, 20)).toBe("red");
    expect(await pixel(body, 100, 380)).toBe("blue");

    const half = await processImage(await halves(400, 200), 180);
    expect(half.width).toBe(400);
    expect(await pixel(half.renditions[0]!.body, 20, 100)).toBe("blue");
  });

  it("applies the rotation on top of the EXIF orientation", async () => {
    const sideways = await sharp(await png(1000, 500))
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const twice = await processImage(sideways, 90);
    expect(twice.width).toBe(1000);
    expect(twice.height).toBe(500);
    const thrice = await processImage(sideways, 180);
    expect(thrice.width).toBe(500);
    expect(thrice.height).toBe(1000);
  });

  it("rejects something that is not an image", async () => {
    await expect(processImage(Buffer.from("hello, world"))).rejects.toThrow(
      /Not a readable image/,
    );
  });
});
