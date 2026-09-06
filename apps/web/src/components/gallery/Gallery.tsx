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
import { mediaBase } from "@/services/media";
import { EmptyTiles } from "./EmptyTiles";
import { Lightbox } from "./Lightbox";
import { PhotoCard } from "./PhotoCard";
import { useManifest } from "./useManifest";

type Props = {
  /** What the page pre-rendered; the live manifest replaces it on mount. */
  initialItems: ReadyMediaItem[];
  /** Show the category chips and honour `?category=` in the URL. */
  showFilters?: boolean;
  /** Featured-first, capped — the home-page strip. */
  limit?: number;
};

const FILTERS: Array<{ slug: CategoryFilter; label: string }> = [
  { slug: ALL_CATEGORIES, label: "All" },
  ...MEDIA_CATEGORIES,
];

const categoryFromUrl = (): CategoryFilter => {
  if (typeof window === "undefined") return ALL_CATEGORIES;
  const raw = new URLSearchParams(window.location.search).get("category");
  const parsed = mediaCategorySchema.safeParse(raw);
  return parsed.success ? parsed.data : ALL_CATEGORIES;
};

export const Gallery = ({
  initialItems,
  showFilters = false,
  limit,
}: Props) => {
  const all = useManifest(initialItems);
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [open, setOpen] = useState<number | null>(null);
  const base = mediaBase();

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
          aria-label="Filter projects by category"
        >
          {FILTERS.map((filter) => (
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
        <EmptyTiles count={limit ?? 3} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <PhotoCard
              key={item.id}
              item={item}
              mediaBase={base}
              eager={i < 3}
              onOpen={() => setOpen(i)}
            />
          ))}
        </div>
      )}

      {showFilters && all.length > 0 && (
        <p className="max-w-2xl font-mono text-xs leading-relaxed text-basalt/50">
          Showing {items.length} of {all.length} recent projects. Want to see
          something specific — a paver line, a pattern, a whole backyard? Ask
          and we’ll send photos from jobs like yours.
        </p>
      )}

      <Lightbox
        items={items}
        index={open}
        mediaBase={base}
        onClose={() => setOpen(null)}
        onStep={step}
      />
    </div>
  );
};
