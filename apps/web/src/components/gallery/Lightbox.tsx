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

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={alt}
      className="m-auto max-h-[100dvh] w-full max-w-6xl bg-transparent p-0 text-bone backdrop:bg-basalt-950/92 backdrop:backdrop-blur-sm"
    >
      {item && (
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="eyebrow text-ochre-light">
                {category}
                {item.city && ` · ${item.city}`}
              </span>
              <span className="truncate font-display-wide text-xl font-extrabold">
                {item.title || category}
              </span>
            </div>
            <Button
              variant="bare"
              onClick={onClose}
              aria-label={copy.close}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile border border-bone/20 hover:bg-bone/10"
            >
              <X className="h-5 w-5" />
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
              className="mx-auto max-h-[78dvh] w-auto rounded-tile object-contain"
            />
            {items.length > 1 && (
              <>
                <Button
                  variant="bare"
                  onClick={() => onStep(-1)}
                  aria-label={copy.previous}
                  className="absolute top-1/2 left-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-tile bg-basalt/70 hover:bg-basalt"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="bare"
                  onClick={() => onStep(1)}
                  aria-label={copy.next}
                  className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-tile bg-basalt/70 hover:bg-basalt"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {item.detail && (
            <p className="font-mono text-xs text-sand/70">{item.detail}</p>
          )}
        </div>
      )}
    </dialog>
  );
};
