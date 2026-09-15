import { Pause, Play } from "lucide-react";
import {
  VIDEO_SIZES,
  renditionUrl,
  videoUrl,
  type ReadyVideoItem,
} from "@marino/domain";
import { Button } from "@/components/ui/Button";
import type { GalleryCopy } from "@/content/copy";
import { useMutedAutoplay } from "./useMutedAutoplay";

type Props = {
  item: ReadyVideoItem;
  mediaBase: string;
  copy: GalleryCopy;
};

/**
 * A moving tile in the grid: the 480p rendition, silent, looping, and paused
 * the moment it scrolls away.
 *
 * The one control is pause, which is the only one a silent loop needs — and
 * it sits above the tile's own open-larger button rather than inside it,
 * because a button within a button is neither valid HTML nor reachable by
 * anyone using a keyboard.
 */
export const VideoTile = ({ item, mediaBase, copy }: Props) => {
  const { ref, playing, toggle } = useMutedAutoplay(true);

  return (
    <>
      <video
        ref={ref}
        src={videoUrl(mediaBase, item, VIDEO_SIZES.grid)}
        // The poster is the smallest rendition of the captured frame: it is
        // what fills the tile until the first video frame decodes, so it
        // wants to arrive fast rather than look perfect.
        poster={renditionUrl(mediaBase, item, item.image.widths[0]!)}
        width={item.video.width}
        height={item.video.height}
        muted
        loop
        playsInline
        preload="none"
        className="h-full w-full object-cover"
      >
        {copy.videoUnsupported}
      </video>
      <Button
        variant="bare"
        onClick={toggle}
        aria-label={playing ? copy.pause : copy.play}
        className="absolute right-3 bottom-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-taupe-950/55 text-white transition-colors hover:bg-taupe-950/80"
      >
        {playing ? (
          <Pause className="h-4 w-4" strokeWidth={1.8} />
        ) : (
          <Play className="h-4 w-4" strokeWidth={1.8} />
        )}
      </Button>
    </>
  );
};
