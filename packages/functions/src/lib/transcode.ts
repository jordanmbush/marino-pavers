import {
  VIDEO_RENDITION_HEIGHTS,
  frameSetPrefix,
  videoDestinationPrefix,
  type Rotation,
} from "@marino/domain";
import {
  CreateJobCommand,
  MediaConvertClient,
  type InputRotate,
  type JobSettings,
  type Output,
} from "@aws-sdk/client-mediaconvert";

/**
 * Everything the Lambdas need from MediaConvert, and nothing else — the same
 * shape as `ObjectStore`, and for the same reason: the handlers are written
 * against this interface so the tests can run the whole pipeline on a fake.
 */

export type TranscodeRequest = {
  id: string;
  rotation: Rotation;
  /** Key of the original in the media bucket. */
  inputKey: string;
};

export interface Transcoder {
  /** Starts the job and resolves with the id the completion event will carry. */
  submit(request: TranscodeRequest): Promise<string>;
}

/**
 * The ceiling for each rendition, in bits per second. QVBR spends well under
 * these on a static patio and saves the headroom for the one shot that pans
 * across gravel, which is where a fixed bitrate falls apart.
 */
const MAX_BITRATE: Record<number, number> = { 480: 1_200_000, 1080: 5_000_000 };

const maxBitrateFor = (height: number): number =>
  MAX_BITRATE[height] ?? Math.round(height * 4_000);

/**
 * How the source should be turned.
 *
 * `AUTO` is the right answer almost always: a phone writes its orientation
 * into the container rather than into the pixels, and MediaConvert ignores
 * that metadata unless asked to read it. So rotation 0 — what every upload
 * starts at — means "believe the camera".
 *
 * The client only reaches for the rotate buttons when that came out wrong,
 * which is precisely when the metadata was missing or lying. A degree value
 * therefore *replaces* AUTO rather than composing with it: there is no way
 * to ask for both, and in the only case where it is asked for, there is
 * nothing worth composing with.
 */
const rotateFor = (rotation: Rotation): InputRotate =>
  rotation === 0 ? "AUTO" : (`DEGREES_${rotation}` as InputRotate);

const videoOutput = (height: number): Output => ({
  NameModifier: String(height),
  ContainerSettings: {
    Container: "MP4",
    // The moov atom goes at the front or the browser must download the whole
    // file before it can show a frame — which for an autoplaying grid tile
    // is the difference between instant and never.
    Mp4Settings: { MoovPlacement: "PROGRESSIVE_DOWNLOAD" },
  },
  VideoDescription: {
    // Height only: the width follows the source's aspect ratio, so a
    // portrait clip stays portrait instead of being letterboxed into 16:9.
    Height: height,
    CodecSettings: {
      Codec: "H_264",
      H264Settings: {
        RateControlMode: "QVBR",
        QvbrSettings: { QvbrQualityLevel: 7 },
        MaxBitrate: maxBitrateFor(height),
        SceneChangeDetect: "TRANSITION_DETECTION",
        GopSizeUnits: "AUTO",
        QualityTuningLevel: "SINGLE_PASS",
        // Baseline-ish compatibility: every phone and browser decodes this.
        CodecProfile: "HIGH",
        CodecLevel: "AUTO",
      },
    },
  },
  AudioDescriptions: [
    {
      AudioSourceName: "Audio Selector 1",
      CodecSettings: {
        Codec: "AAC",
        AacSettings: {
          Bitrate: 96_000,
          CodingMode: "CODING_MODE_2_0",
          SampleRate: 48_000,
        },
      },
    },
  ],
});

/**
 * Three frames, one a second apart. The completion handler takes the last
 * one that landed, so the poster is about two seconds in rather than the
 * half-raised phone that is frame zero — and a clip shorter than that still
 * yields whatever frames it had.
 */
const POSTER_CAPTURES = 3;

export const buildJobSettings = ({
  bucket,
  id,
  rotation,
  inputKey,
}: TranscodeRequest & { bucket: string }): JobSettings => ({
  TimecodeConfig: { Source: "ZEROBASED" },
  Inputs: [
    {
      FileInput: `s3://${bucket}/${inputKey}`,
      TimecodeSource: "ZEROBASED",
      // A silent source simply produces no audio track; it is not an error.
      AudioSelectors: { "Audio Selector 1": { DefaultSelection: "DEFAULT" } },
      VideoSelector: { Rotate: rotateFor(rotation) },
    },
  ],
  OutputGroups: [
    {
      Name: "MP4",
      OutputGroupSettings: {
        Type: "FILE_GROUP_SETTINGS",
        FileGroupSettings: {
          Destination: `s3://${bucket}/${videoDestinationPrefix(id, rotation)}`,
        },
      },
      Outputs: VIDEO_RENDITION_HEIGHTS.map(videoOutput),
    },
    {
      Name: "Poster",
      OutputGroupSettings: {
        Type: "FILE_GROUP_SETTINGS",
        FileGroupSettings: {
          Destination: `s3://${bucket}/${frameSetPrefix(id, rotation)}`,
        },
      },
      Outputs: [
        {
          ContainerSettings: { Container: "RAW" },
          VideoDescription: {
            CodecSettings: {
              Codec: "FRAME_CAPTURE",
              FrameCaptureSettings: {
                FramerateNumerator: 1,
                FramerateDenominator: 1,
                MaxCaptures: POSTER_CAPTURES,
                Quality: 90,
              },
            },
          },
        },
      ],
    },
  ],
});

export type MediaConvertOptions = {
  bucket: string;
  /** The role MediaConvert assumes to read the original and write the outputs. */
  roleArn: string;
  /**
   * Which deployment this job belongs to. Job state changes are an
   * account-wide event, so every stage in the account hears every other
   * stage's jobs; the completion rule matches on this to hear only its own.
   */
  stage: string;
  /** Omitted means the account's default on-demand queue. */
  queueArn?: string;
  client?: MediaConvertClient;
};

export const createMediaConvertTranscoder = ({
  bucket,
  roleArn,
  stage,
  queueArn,
  client = new MediaConvertClient({}),
}: MediaConvertOptions): Transcoder => ({
  async submit(request) {
    const response = await client.send(
      new CreateJobCommand({
        Role: roleArn,
        Queue: queueArn,
        // Carried through to the completion event, which is how the handler
        // knows which item a finished job belongs to without a lookup table.
        UserMetadata: {
          mediaId: request.id,
          rotation: String(request.rotation),
          stage,
        },
        Settings: buildJobSettings({ ...request, bucket }),
      }),
    );
    const jobId = response.Job?.Id;
    if (!jobId) throw new Error("MediaConvert accepted the job without an id");
    return jobId;
  },
});
