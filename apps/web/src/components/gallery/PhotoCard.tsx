import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SIZES,
  categoryLabel,
  fallbackSrc,
  srcSet,
  type ReadyMediaItem,
} from "@marino/domain";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";

type Props = {
  item: ReadyMediaItem;
  mediaBase: string;
  onOpen: () => void;
  /** Eager for the first row so the page doesn't paint a hole above the fold. */
  eager?: boolean;
};

/**
 * One photo in the grid. The blur placeholder paints instantly as a CSS
 * background; the real image fades over it once decoded.
 */
export const PhotoCard = ({
  item,
  mediaBase,
  onOpen,
  eager = false,
}: Props) => {
  const img = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const alt = item.title || `${categoryLabel(item.category)} project`;

  // The grid is prerendered, so the browser starts fetching the image from
  // the static HTML and can finish before React hydrates. A `load` that fired
  // before `onLoad` was attached is lost; `complete` says whether it did.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <figure className="group relative overflow-hidden rounded-tile border border-basalt/10 shadow-paver">
      <Button
        variant="bare"
        onClick={onOpen}
        aria-label={`View larger: ${alt}`}
        className="block w-full text-left"
      >
        <div
          className="relative aspect-[4/3] w-full overflow-hidden bg-cover bg-center"
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
              "h-full w-full object-cover transition-[opacity,transform] duration-700 group-hover:scale-105",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-basalt/80 via-basalt/10 to-transparent" />
          <span className="absolute top-4 left-4 rounded-tile bg-bone/90 px-2.5 py-1 eyebrow text-[0.6rem] text-basalt">
            {categoryLabel(item.category)}
          </span>
        </div>

        <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5">
          <span className="font-display-wide text-lg leading-tight font-extrabold text-bone">
            {item.title || categoryLabel(item.category)}
          </span>
          {(item.city || item.detail) && (
            <span className="flex flex-wrap items-center gap-1.5 text-xs text-sand/80">
              {item.city && (
                <>
                  <MapPin className="h-3 w-3" />
                  {item.city}
                </>
              )}
              {item.city && item.detail && (
                <span className="text-sand/40">·</span>
              )}
              {item.detail && <span className="font-mono">{item.detail}</span>}
            </span>
          )}
        </figcaption>
      </Button>
    </figure>
  );
};
