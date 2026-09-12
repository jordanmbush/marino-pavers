import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  SIZES,
  fallbackSrc,
  srcSet,
  type ReadyMediaItem,
} from "@marino/domain";
import { Button } from "@/components/ui/Button";
import type { GalleryCopy } from "@/content/copy";
import { fill } from "@/services/locale";

type Props = {
  items: ReadyMediaItem[];
  index: number | null;
  mediaBase: string;
  copy: GalleryCopy;
  onClose: () => void;
  onStep: (delta: -1 | 1) => void;
};

const control =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-tile border border-white/30 text-white transition-colors hover:border-white hover:bg-white/10";

/**
 * A native <dialog>: modal focus, Escape to close and a backdrop for free.
 * Arrow keys step through the set; clicking the dim backdrop closes it.
 */
export const Lightbox = ({
  items,
  index,
  mediaBase,
  copy,
  onClose,
  onStep,
}: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const item = index === null ? null : items[index];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  // A click on the dialog element itself (not its children) is the backdrop.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener("click", onBackdrop);
    return () => dialog.removeEventListener("click", onBackdrop);
  }, [onClose]);

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") onStep(-1);
      if (event.key === "ArrowRight") onStep(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onStep]);

  const category = item ? copy.categories[item.category] : "";
  const alt = item ? item.title || fill(copy.project, { category }) : "";
  const where = item ? [item.city, item.detail].filter(Boolean).join(", ") : "";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={alt}
      className="m-auto max-h-[100dvh] w-full max-w-6xl bg-transparent p-0 text-white backdrop:bg-taupe-950/95"
    >
      {item && (
        <div className="flex flex-col gap-5 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1 leading-snug">
              <span className="truncate text-2xl">
                {item.title || category}
              </span>
              <span className="text-base text-taupe-300">
                {item.title ? category : null}
                {item.title && where ? ", " : null}
                {where}
              </span>
            </div>
            <Button
              variant="bare"
              onClick={onClose}
              aria-label={copy.close}
              className={control}
            >
              <X className="h-5 w-5" strokeWidth={1.6} />
            </Button>
          </div>

          <div className="relative">
            <img
              key={item.id}
              src={fallbackSrc(mediaBase, item)}
              srcSet={srcSet(mediaBase, item)}
              sizes={SIZES.lightbox}
              width={item.image.width}
              height={item.image.height}
              alt={alt}
              decoding="async"
              className="mx-auto max-h-[78dvh] w-auto object-contain"
            />
            {items.length > 1 && (
              <>
                <Button
                  variant="bare"
                  onClick={() => onStep(-1)}
                  aria-label={copy.previous}
                  className={`${control} absolute top-1/2 left-2 -translate-y-1/2 bg-taupe-950/70`}
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.6} />
                </Button>
                <Button
                  variant="bare"
                  onClick={() => onStep(1)}
                  aria-label={copy.next}
                  className={`${control} absolute top-1/2 right-2 -translate-y-1/2 bg-taupe-950/70`}
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={1.6} />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
};
