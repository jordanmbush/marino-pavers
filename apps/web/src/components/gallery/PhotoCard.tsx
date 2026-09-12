import { useEffect, useRef, useState } from "react";
import {
  SIZES,
  fallbackSrc,
  srcSet,
  type ReadyMediaItem,
} from "@marino/domain";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import type { GalleryCopy } from "@/content/copy";
import { fill } from "@/services/locale";

type Props = {
  item: ReadyMediaItem;
  mediaBase: string;
  copy: GalleryCopy;
  onOpen: () => void;
  /** Eager for the first row so the page doesn't paint a hole above the fold. */
  eager?: boolean;
};

/**
 * One photo in the grid, captioned underneath like a print. The blur
 * placeholder paints instantly as a CSS background; the real image fades
 * over it once decoded.
 */
export const PhotoCard = ({
  item,
  mediaBase,
  copy,
  onOpen,
  eager = false,
}: Props) => {
  const img = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const category = copy.categories[item.category];
  const alt = item.title || fill(copy.project, { category });
  const where = [item.city, item.detail].filter(Boolean).join(", ");

  // The grid is prerendered, so the browser starts fetching the image from
  // the static HTML and can finish before React hydrates. A `load` that fired
  // before `onLoad` was attached is lost; `complete` says whether it did.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <figure className="flex flex-col gap-3">
      <Button
        variant="bare"
        onClick={onOpen}
        aria-label={fill(copy.viewLarger, { alt })}
        className="block w-full"
      >
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-tile bg-taupe-100 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.image.placeholder})` }}
        >
          <img
            ref={img}
            src={fallbackSrc(mediaBase, item)}
            srcSet={srcSet(mediaBase, item)}
            sizes={SIZES.gridThird}
            width={item.image.width}
            height={item.image.height}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-700",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </Button>
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
