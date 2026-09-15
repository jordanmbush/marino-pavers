import {
  framePrefix,
  frameSetPrefix,
  parseVideoRenditionHeight,
  renditionKey,
  type MediaItem,
  type MediaVideo,
} from "@marino/domain";
import sharp from "sharp";
import { processImage } from "./lib/image";
import {
  RENDITION_CACHE,
  deleteStaleRenditions,
  readItem,
  rebuildManifest,
  writeItem,
} from "./lib/items";
import { consoleLogger, type Logger } from "./lib/logger";
import { createS3Store, type ObjectStore } from "./lib/s3";

/**
 * The other end of `process-video`: MediaConvert says a job finished, and
 * this turns that into a ready item.
 *
 * The poster is the interesting part. MediaConvert captures a frame, and
 * that frame then goes through the very same `processImage` a photo does —
 * same WebP renditions, same widths, same blur placeholder, written under
 * the same keys. Which is why nothing downstream has a video branch: the
 * grid, the lightbox, the admin thumbnail and every `srcset` on the site
 * treat a video's poster as the photo it is.
 */

export type VideoCompleteDeps = {
  store: ObjectStore;
  now?: () => Date;
  logger?: Logger;
};

/** The slice of the MediaConvert job-state event this handler reads. */
export type JobStateEvent = {
  detail: {
    status: string;
    jobId: string;
    userMetadata?: Record<string, string>;
    errorMessage?: string;
    errorCode?: number;
    outputGroupDetails?: Array<{
      outputDetails?: Array<{
        outputFilePaths?: string[];
        durationInMs?: number;
        videoDetails?: { widthInPx?: number; heightInPx?: number };
      }>;
    }>;
  };
};

type VideoOutput = {
  key: string;
  height: number;
  width: number;
  durationMs: number;
};

/** `s3://bucket/a/b.mp4` → `a/b.mp4`; anything else is left alone. */
const keyOf = (path: string): string =>
  path.replace(/^s3:\/\/[^/]+\//, "").replace(/^\/+/, "");

/**
 * The MP4s the job wrote, keyed by the height in their own filename rather
 * than the height MediaConvert reports. The two agree, but the filename is
 * what the site will ask for, so the filename is what decides.
 */
const videoOutputs = (event: JobStateEvent): VideoOutput[] => {
  const outputs: VideoOutput[] = [];
  for (const group of event.detail.outputGroupDetails ?? []) {
    for (const output of group.outputDetails ?? []) {
      for (const path of output.outputFilePaths ?? []) {
        const key = keyOf(path);
        const height = parseVideoRenditionHeight(key);
        if (height === null) continue;
        outputs.push({
          key,
          height,
          width: output.videoDetails?.widthInPx ?? 0,
          durationMs: output.durationInMs ?? 0,
        });
      }
    }
  }
  return outputs.sort((a, b) => a.height - b.height);
};

const describeVideo = (outputs: VideoOutput[]): MediaVideo | null => {
  const largest = outputs[outputs.length - 1];
  if (!largest) return null;
  const durationMs = Math.max(...outputs.map((output) => output.durationMs));
  if (largest.width <= 0 || largest.height <= 0 || durationMs <= 0) return null;
  return {
    width: largest.width,
    height: largest.height,
    heights: [...new Set(outputs.map((output) => output.height))],
    durationSeconds: durationMs / 1000,
  };
};

/**
 * MediaConvert writes its outputs as itself, so they arrive with neither the
 * year-long cache the rest of `renditions/` is served with nor a guaranteed
 * content type — and a `.mp4` served as `binary/octet-stream` is a video
 * that silently will not play. A self-copy fixes both server-side: no bytes
 * pass through this Lambda.
 */
const publishRenditions = async (
  store: ObjectStore,
  outputs: readonly VideoOutput[],
): Promise<void> => {
  await Promise.all(
    outputs.map((output) =>
      store.setObjectHeaders(output.key, "video/mp4", RENDITION_CACHE),
    ),
  );
};

const markFailed = async (
  store: ObjectStore,
  item: MediaItem,
  reason: string,
  at: string,
): Promise<void> => {
  await writeItem(store, {
    ...item,
    status: "failed",
    error: reason,
    updatedAt: at,
  });
};

/**
 * The poster: the last frame the job captured — about two seconds in, past
 * whatever the camera was pointed at while the client pressed record.
 *
 * It is rendered at rotation 0 because the frame is already the right way
 * up: the turning happened in the transcode, so turning it again here would
 * undo it. The item's rotation still names the key, which is what keeps a
 * year-long cache from serving the old orientation.
 */
const buildPoster = async (
  store: ObjectStore,
  item: MediaItem,
): Promise<MediaItem["image"] | null> => {
  const frames = await store.listKeys(frameSetPrefix(item.id, item.rotation));
  const latest = frames.sort()[frames.length - 1];
  if (!latest) return null;
  const frame = await store.getObject(latest);
  if (!frame) return null;

  const processed = await processImage(frame.body, 0);
  await Promise.all(
    processed.renditions.map((rendition) =>
      store.putObject(
        renditionKey(item.id, item.rotation, rendition.width),
        rendition.body,
        "image/webp",
        RENDITION_CACHE,
      ),
    ),
  );
  return {
    width: processed.width,
    height: processed.height,
    widths: processed.renditions.map((rendition) => rendition.width),
    placeholder: processed.placeholder,
  };
};

const complete = async (
  event: JobStateEvent,
  item: MediaItem,
  { store, now, logger }: Required<VideoCompleteDeps>,
): Promise<void> => {
  const at = now().toISOString();
  const outputs = videoOutputs(event);
  const video = describeVideo(outputs);
  if (!video) {
    logger.error("job completed without usable video outputs", {
      id: item.id,
      jobId: event.detail.jobId,
    });
    await markFailed(store, item, "The transcoder produced no video.", at);
    return;
  }

  try {
    await publishRenditions(store, outputs);
  } catch (error) {
    logger.error("could not publish the transcoded renditions", {
      id: item.id,
      jobId: event.detail.jobId,
      error,
    });
    await markFailed(store, item, "The video could not be published.", at);
    return;
  }

  const image = await buildPoster(store, item);
  if (!image) {
    logger.error("job completed without a poster frame", {
      id: item.id,
      jobId: event.detail.jobId,
    });
    await markFailed(store, item, "The transcoder captured no poster.", at);
    return;
  }

  await writeItem(store, {
    ...item,
    kind: "video",
    status: "ready",
    image,
    video,
    error: undefined,
    updatedAt: at,
  });
  await rebuildManifest(store, now(), logger);
  await deleteStaleRenditions(store, item.id, item.rotation);
  // The captured frames were scaffolding for the poster renditions, and they
  // sit outside the published prefix precisely so they can go now.
  await store.deleteByPrefix(framePrefix(item.id));
  logger.info("video ready", {
    id: item.id,
    jobId: event.detail.jobId,
    heights: video.heights,
    seconds: video.durationSeconds,
  });
};

export const createVideoCompleteHandler = ({
  store,
  now = () => new Date(),
  logger = consoleLogger,
}: VideoCompleteDeps) => {
  const deps = { store, now, logger };

  return async (event: JobStateEvent): Promise<void> => {
    const { status, jobId, userMetadata } = event.detail;
    if (status !== "COMPLETE" && status !== "ERROR" && status !== "CANCELED") {
      return;
    }

    const id = userMetadata?.mediaId;
    if (!id) {
      logger.warn("job state change without a media id", { jobId, status });
      return;
    }

    const item = await readItem(store, id, logger);
    if (!item) {
      logger.warn("job finished for an item that no longer exists", {
        id,
        jobId,
      });
      await store.deleteByPrefix(framePrefix(id));
      return;
    }

    // A second rotation submitted while the first was still running means two
    // jobs are in flight for one item. Only the one the record is waiting on
    // may write; the loser is dropped, and whatever it left behind is swept
    // by `deleteStaleRenditions` or overwritten by the winner.
    if (item.jobId !== undefined && item.jobId !== jobId) {
      logger.info("ignoring a superseded job", {
        id,
        jobId,
        waitingFor: item.jobId,
      });
      return;
    }

    if (status === "COMPLETE") {
      await complete(event, item, deps);
      return;
    }

    const reason =
      event.detail.errorMessage ??
      (status === "CANCELED"
        ? "The transcode was cancelled."
        : "The transcode failed.");
    logger.error("transcode did not complete", { id, jobId, status, reason });
    await markFailed(store, item, reason, deps.now().toISOString());
  };
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
};

let wired: ReturnType<typeof createVideoCompleteHandler> | undefined;

export const handler = (event: JobStateEvent): Promise<void> => {
  if (!wired) {
    // One image at a time inside libvips; the Lambda is already sized to it.
    sharp.concurrency(1);
    wired = createVideoCompleteHandler({
      store: createS3Store(requireEnv("MEDIA_BUCKET")),
    });
  }
  return wired(event);
};
