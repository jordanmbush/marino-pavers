import { RotateCcw, RotateCw, Video } from "lucide-react";
import {
  SIZES,
  isReady,
  renditionUrl,
  srcSet,
  type MediaItem,
  type Rotation,
} from "@marino/domain";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { mediaBase } from "@/services/media";

type Props = {
  item: MediaItem;
  /** The draft's rotation. The picture is previewed turned by however much it differs from what's stored. */
  rotation: Rotation;
  onTurn: (delta: -1 | 1) => void;
};

/**
 * On a phone the box is 4:3, so a sideways preview is scaled down to fit
 * inside it; from `sm` the box is square and a quarter turn fills it exactly.
 */
const PREVIEW: Record<Rotation, string> = {
  0: "",
  90: "rotate-90 scale-75 sm:scale-100",
  180: "rotate-180",
  270: "-rotate-90 scale-75 sm:scale-100",
};

/**
 * The picture, and the two buttons that turn it. Turning only changes the
 * draft: the real renditions are re-made once the row is saved, and until
 * then the stored one is shown rotated with CSS.
 *
 * For a video that re-make is a whole new transcode — a minute or two, not a
 * moment — which is why the buttons say as much before they are pressed.
 */
export const Thumbnail = ({ item, rotation, onTurn }: Props) => {
  const ready = isReady(item);
  const preview = ((rotation - item.rotation + 360) % 360) as Rotation;
  const turnHint =
    item.kind === "video"
      ? "Saving a turned video re-processes it, which takes a minute or two."
      : "Saving a turned photo re-processes it.";

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-tile bg-taupe-100 sm:aspect-square">
        {ready ? (
          <img
            src={renditionUrl(mediaBase(), item, item.image.widths[0]!)}
            srcSet={srcSet(mediaBase(), item)}
            sizes={SIZES.thumb}
            alt=""
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              PREVIEW[preview],
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center font-mono text-[0.65rem] text-taupe-900/60">
            {item.status === "failed" ? "Didn’t process" : "Processing…"}
          </div>
        )}
        {ready && item.kind === "video" && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-tile bg-taupe-950/70 px-2 py-0.5 label text-[0.55rem] text-white">
            <Video className="h-3 w-3" strokeWidth={2} />
            Video
          </span>
        )}
        {item.featured && (
          <span className="absolute top-2 left-2 rounded-tile bg-taupe-700 px-2 py-0.5 label text-[0.55rem] text-white">
            Featured
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onTurn(-1)}
          disabled={!ready}
          aria-label="Rotate left"
          title={turnHint}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onTurn(1)}
          disabled={!ready}
          aria-label="Rotate right"
          title={turnHint}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
