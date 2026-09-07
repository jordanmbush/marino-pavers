import { useCallback, useEffect, useState } from "react";
import {
  ALL_CATEGORIES,
  MEDIA_CATEGORIES,
  featuredItems,
  filterByCategory,
  mediaCategorySchema,
  type CategoryFilter,
  type ReadyMediaItem,
} from "@marino/domain";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import type { GalleryCopy } from "@/content/copy";
import { fill } from "@/services/locale";
import { mediaBase } from "@/services/media";
import { EmptyTiles } from "./EmptyTiles";
import { Lightbox } from "./Lightbox";
import { PhotoCard } from "./PhotoCard";
import { useManifest } from "./useManifest";

type Props = {
  /** What the page pre-rendered; the live manifest replaces it on mount. */
  initialItems: ReadyMediaItem[];
  /** The page's language, as strings. The island never imports a dictionary. */
  copy: GalleryCopy;
  /** Show the category chips and honour `?category=` in the URL. */
  showFilters?: boolean;
  /** Featured-first, capped — the home-page strip. */
  limit?: number;
};

const categoryFromUrl = (): CategoryFilter => {
  if (typeof window === "undefined") return ALL_CATEGORIES;
  const raw = new URLSearchParams(window.location.search).get("category");
  const parsed = mediaCategorySchema.safeParse(raw);
  return parsed.success ? parsed.data : ALL_CATEGORIES;
};

export const Gallery = ({
  initialItems,
  copy,
  showFilters = false,
  limit,
}: Props) => {
  const all = useManifest(initialItems);
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [open, setOpen] = useState<number | null>(null);
  const base = mediaBase();

  const filters: Array<{ slug: CategoryFilter; label: string }> = [
    { slug: ALL_CATEGORIES, label: copy.all },
    ...MEDIA_CATEGORIES.map(({ slug }) => ({
      slug,
      label: copy.categories[slug],
    })),
  ];

  useEffect(() => {
    if (showFilters) setCategory(categoryFromUrl());
  }, [showFilters]);

  const filtered = filterByCategory(all, category);
  const items = limit === undefined ? filtered : featuredItems(filtered, limit);

  const step = useCallback(
    (delta: -1 | 1) =>
      setOpen((current) =>
        current === null
          ? null
          : (current + delta + items.length) % items.length,
      ),
    [items.length],
  );

  return (
    <div className="flex flex-col gap-10">
      {showFilters && (
        <div
          className="flex flex-wrap gap-2.5"
          role="group"
          aria-label={copy.filterLabel}
        >
          {filters.map((filter) => (
            <Button
              key={filter.slug}
              variant="bare"
              onClick={() => setCategory(filter.slug)}
              aria-pressed={category === filter.slug}
              className={cn(
                "rounded-tile border px-4 py-2.5 eyebrow transition-colors",
                category === filter.slug
                  ? "border-basalt bg-basalt text-bone"
                  : "border-basalt/15 bg-bone text-basalt/60 hover:border-basalt/40 hover:text-basalt",
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyTiles count={limit ?? 3} message={copy.empty} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <PhotoCard
              key={item.id}
              item={item}
              mediaBase={base}
              copy={copy}
              eager={i < 3}
              onOpen={() => setOpen(i)}
            />
          ))}
        </div>
      )}

      {showFilters && all.length > 0 && (
        <p className="max-w-2xl font-mono text-xs leading-relaxed text-basalt/50">
          {fill(copy.showing, { shown: items.length, total: all.length })}
        </p>
      )}

      <Lightbox
        items={items}
        index={open}
        mediaBase={base}
        copy={copy}
        onClose={() => setOpen(null)}
        onStep={step}
      />
    </div>
  );
};
