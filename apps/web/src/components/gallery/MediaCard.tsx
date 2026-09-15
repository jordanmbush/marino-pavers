import { isVideo, type ReadyMediaItem } from "@marino/domain";
import { Button } from "@/components/ui/Button";
import type { GalleryCopy } from "@/content/copy";
import { fill } from "@/services/locale";
import { PhotoTile } from "./PhotoTile";
import { VideoTile } from "./VideoTile";

type Props = {
  item: ReadyMediaItem;
  mediaBase: string;
  copy: GalleryCopy;
  onOpen: () => void;
  /** Eager for the first row so the page doesn't paint a hole above the fold. */
  eager?: boolean;
};

/**
 * One project in the grid, captioned underneath like a print. A video is the
 * same card with a moving tile — same shape, same caption, same click — so a
 * mixed gallery reads as one set of work rather than two.
 *
 * The open-larger target is a transparent button laid over the whole tile
 * rather than a wrapper around it. That is what lets a video put its own
 * pause control on top (`z-20` over this one's `z-10`) without nesting one
 * button inside another.
 */
export const MediaCard = ({
  item,
  mediaBase,
  copy,
  onOpen,
  eager = false,
}: Props) => {
  const category = copy.categories[item.category];
  const alt = item.title || fill(copy.project, { category });
  const where = [item.city, item.detail].filter(Boolean).join(", ");

  return (
    <figure className="flex flex-col gap-3">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-tile bg-taupe-100 bg-cover bg-center"
        style={{ backgroundImage: `url(${item.image.placeholder})` }}
      >
        {isVideo(item) ? (
          <VideoTile item={item} mediaBase={mediaBase} copy={copy} />
        ) : (
          <PhotoTile
            item={item}
            mediaBase={mediaBase}
            alt={alt}
            eager={eager}
          />
        )}
        <Button
          variant="bare"
          onClick={onOpen}
          className="absolute inset-0 z-10 block h-full w-full"
        >
          <span className="sr-only">{fill(copy.viewLarger, { alt })}</span>
        </Button>
      </div>
      <figcaption className="flex flex-col gap-0.5 leading-snug">
        <span className="text-xl text-taupe-950">{item.title || category}</span>
        <span className="text-base text-taupe-500">
          {item.title ? category : null}
          {item.title && where ? ", " : null}
          {where}
        </span>
      </figcaption>
    </figure>
  );
};
