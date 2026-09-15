import { useEffect, useRef, useState } from "react";
import {
  SIZES,
  fallbackSrc,
  srcSet,
  type ReadyMediaItem,
} from "@marino/domain";
import { cn } from "@/components/ui/cn";

type Props = {
  item: ReadyMediaItem;
  mediaBase: string;
  alt: string;
  /** Eager for the first row so the page doesn't paint a hole above the fold. */
  eager?: boolean;
};

/** The still half of a card: the photo, fading over its blur placeholder. */
export const PhotoTile = ({ item, mediaBase, alt, eager = false }: Props) => {
  const img = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // The grid is prerendered, so the browser starts fetching the image from
  // the static HTML and can finish before React hydrates. A `load` that fired
  // before `onLoad` was attached is lost; `complete` says whether it did.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
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
  );
};
