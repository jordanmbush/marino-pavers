import {
  SIZES,
  VIDEO_SIZES,
  fallbackSrc,
  isVideo,
  srcSet,
  videoUrl,
  type ReadyMediaItem,
  type ReadyVideoItem,
} from "@marino/domain";
import type { GalleryCopy } from "@/content/copy";
import { useMutedAutoplay } from "./useMutedAutoplay";

type Props = {
  item: ReadyMediaItem;
  mediaBase: string;
  copy: GalleryCopy;
  alt: string;
};

const FIT = "mx-auto max-h-[78dvh] w-auto object-contain";

/**
 * A video with the screen to itself gets the 1080p rendition and the
 * browser's own controls — scrub, volume, fullscreen, all of it free and all
 * of it already familiar. It still starts muted and looping, so opening a
 * card is quiet; turning the sound on is one click away for the day the
 * client wants a clip that has some.
 */
const Video = ({
  item,
  mediaBase,
  copy,
  alt,
}: Omit<Props, "item"> & { item: ReadyVideoItem }) => {
  const { ref } = useMutedAutoplay(false);

  return (
    <video
      ref={ref}
      src={videoUrl(mediaBase, item, VIDEO_SIZES.lightbox)}
      poster={fallbackSrc(mediaBase, item)}
      width={item.video.width}
      height={item.video.height}
      aria-label={alt}
      muted
      controls
      loop
      playsInline
      preload="auto"
      className={FIT}
    >
      {copy.videoUnsupported}
    </video>
  );
};

/**
 * The photo or the video, whichever this item is. Keyed by id at the call
 * site so stepping to the next project mounts a fresh element rather than
 * re-pointing the old one, which is what makes a video start over — and
 * start muted — instead of carrying the last one's state across.
 */
export const LightboxMedia = ({ item, mediaBase, copy, alt }: Props) =>
  isVideo(item) ? (
    <Video item={item} mediaBase={mediaBase} copy={copy} alt={alt} />
  ) : (
    <img
      src={fallbackSrc(mediaBase, item)}
      srcSet={srcSet(mediaBase, item)}
      sizes={SIZES.lightbox}
      width={item.image.width}
      height={item.image.height}
      alt={alt}
      decoding="async"
      className={FIT}
    />
  );
