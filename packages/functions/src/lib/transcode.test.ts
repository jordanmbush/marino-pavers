import {
  VIDEO_RENDITION_HEIGHTS,
  frameSetPrefix,
  originalKey,
  videoRenditionKey,
} from "@marino/domain";
import { describe, expect, it } from "vitest";
import { buildJobSettings, createMediaConvertTranscoder } from "./transcode";

const ID = "0123456789abcdef";
const BUCKET = "media";

const settings = (rotation: 0 | 90 | 180 | 270 = 0) =>
  buildJobSettings({
    bucket: BUCKET,
    id: ID,
    rotation,
    inputKey: originalKey(ID, "mp4"),
  });

const group = (name: string, rotation: 0 | 90 | 180 | 270 = 0) =>
  settings(rotation).OutputGroups?.find((g) => g.Name === name);

const destinationOf = (name: string, rotation: 0 | 90 | 180 | 270 = 0) =>
  group(name, rotation)?.OutputGroupSettings?.FileGroupSettings?.Destination;

/**
 * A wrong setting here fails silently — the job runs, and what lands in the
 * bucket is not what the site asks for — so the keys are checked against the
 * very functions the gallery builds its URLs from.
 */
describe("the transcode job", () => {
  it("reads the original straight out of the bucket", () => {
    expect(settings().Inputs?.[0]?.FileInput).toBe(
      `s3://${BUCKET}/originals/${ID}.mp4`,
    );
  });

  it("believes the camera until the client says otherwise", () => {
    expect(settings(0).Inputs?.[0]?.VideoSelector?.Rotate).toBe("AUTO");
    expect(settings(90).Inputs?.[0]?.VideoSelector?.Rotate).toBe("DEGREES_90");
    expect(settings(270).Inputs?.[0]?.VideoSelector?.Rotate).toBe(
      "DEGREES_270",
    );
  });

  it("writes each rendition to the key the gallery will ask for", () => {
    const destination = destinationOf("MP4");
    const outputs = group("MP4")?.Outputs ?? [];
    expect(
      outputs.map((output) => `${destination}${output.NameModifier}.mp4`),
    ).toEqual(
      VIDEO_RENDITION_HEIGHTS.map(
        (height) => `s3://${BUCKET}/${videoRenditionKey(ID, 0, height)}`,
      ),
    );
  });

  it("puts a rotated set under its own prefix, so no cache can outlive it", () => {
    expect(destinationOf("MP4", 90)).toContain(`/${ID}/r90/`);
    expect(destinationOf("MP4", 0)).toContain(`/${ID}/r0/`);
  });

  it("captures the poster outside the published prefix", () => {
    expect(destinationOf("Poster")).toBe(
      `s3://${BUCKET}/${frameSetPrefix(ID, 0)}`,
    );
    expect(destinationOf("Poster")).not.toContain("/renditions/");
  });

  it("captures more than one frame, so the poster isn't frame zero", () => {
    const capture =
      group("Poster")?.Outputs?.[0]?.VideoDescription?.CodecSettings
        ?.FrameCaptureSettings;
    expect(capture?.MaxCaptures).toBeGreaterThan(1);
  });

  it("sizes by height alone, so a portrait clip stays portrait", () => {
    for (const output of group("MP4")?.Outputs ?? []) {
      expect(output.VideoDescription?.Height).toBeGreaterThan(0);
      expect(output.VideoDescription?.Width).toBeUndefined();
    }
  });

  it("puts the moov atom first, or nothing starts until it all arrives", () => {
    for (const output of group("MP4")?.Outputs ?? []) {
      expect(output.ContainerSettings?.Mp4Settings?.MoovPlacement).toBe(
        "PROGRESSIVE_DOWNLOAD",
      );
    }
  });

  it("encodes H.264 with audio, which is what every browser plays", () => {
    for (const output of group("MP4")?.Outputs ?? []) {
      expect(output.VideoDescription?.CodecSettings?.Codec).toBe("H_264");
      expect(output.AudioDescriptions?.[0]?.CodecSettings?.Codec).toBe("AAC");
    }
  });

  it("spends less on the small rendition than the large one", () => {
    const bitrates = (group("MP4")?.Outputs ?? []).map(
      (output) =>
        output.VideoDescription?.CodecSettings?.H264Settings?.MaxBitrate ?? 0,
    );
    expect(bitrates).toEqual([...bitrates].sort((a, b) => a - b));
    expect(bitrates[0]).toBeGreaterThan(0);
  });
});

describe("submitting", () => {
  const fakeClient = () => {
    const sent: Array<{ input: Record<string, unknown> }> = [];
    return {
      sent,
      client: {
        send: (command: { input: Record<string, unknown> }) => {
          sent.push(command);
          return Promise.resolve({ Job: { Id: "job-1" } });
        },
      },
    };
  };

  it("stamps the stage, so only this deployment hears the job finish", async () => {
    const { client, sent } = fakeClient();
    const transcoder = createMediaConvertTranscoder({
      bucket: BUCKET,
      roleArn: "arn:aws:iam::1:role/transcode",
      stage: "production",
      client: client as never,
    });

    await transcoder.submit({
      id: ID,
      rotation: 0,
      inputKey: originalKey(ID, "mp4"),
    });

    expect(sent[0]?.input.UserMetadata).toEqual({
      mediaId: ID,
      rotation: "0",
      stage: "production",
    });
  });

  it("refuses a job it cannot later match to a completion", async () => {
    const transcoder = createMediaConvertTranscoder({
      bucket: BUCKET,
      roleArn: "arn:aws:iam::1:role/transcode",
      stage: "dev",
      client: { send: () => Promise.resolve({}) } as never,
    });

    await expect(
      transcoder.submit({
        id: ID,
        rotation: 0,
        inputKey: originalKey(ID, "mp4"),
      }),
    ).rejects.toThrow(/without an id/);
  });
});
