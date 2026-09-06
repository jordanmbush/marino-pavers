import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  MEDIA_CATEGORIES,
  SIZES,
  isReady,
  renditionUrl,
  srcSet,
  type EditableItem,
  type MediaCategory,
  type MediaItem,
} from "@marino/domain";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { mediaBase } from "@/services/media";

type Props = {
  item: MediaItem;
  first: boolean;
  last: boolean;
  onUpdate: (patch: EditableItem) => void;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
};

const CATEGORY_OPTIONS = MEDIA_CATEGORIES.map((c) => ({
  value: c.slug,
  label: c.label,
}));

/** One photo's editor. Text fields save on blur; toggles and selects save at once. */
export const ItemRow = ({
  item,
  first,
  last,
  onUpdate,
  onMove,
  onDelete,
}: Props) => {
  const [title, setTitle] = useState(item.title);
  const [city, setCity] = useState(item.city);
  const [detail, setDetail] = useState(item.detail);
  const base = mediaBase();
  const ready = isReady(item);

  const saveText = () => {
    const patch: EditableItem = {};
    if (title !== item.title) patch.title = title;
    if (city !== item.city) patch.city = city;
    if (detail !== item.detail) patch.detail = detail;
    if (Object.keys(patch).length > 0) onUpdate(patch);
  };

  const confirmDelete = () => {
    if (
      window.confirm(
        `Delete "${item.title || "this photo"}"? This can't be undone.`,
      )
    )
      onDelete();
  };

  return (
    <li className="grid gap-4 rounded-tile border border-basalt/10 bg-bone p-4 sm:grid-cols-[160px_1fr_auto]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-tile bg-sand-dark sm:aspect-square">
        {ready ? (
          <img
            src={renditionUrl(base, item.id, item.image.widths[0]!)}
            srcSet={srcSet(base, item)}
            sizes={SIZES.thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center font-mono text-[0.65rem] text-basalt/60">
            Processing…
          </div>
        )}
        {item.featured && (
          <span className="absolute top-2 left-2 rounded-tile bg-cherokee px-2 py-0.5 eyebrow text-[0.55rem] text-bone">
            Featured
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          aria-label="Title"
          placeholder="Title (e.g. Desert Ridge patio)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveText}
          className="sm:col-span-2"
        />
        <Select
          aria-label="Category"
          options={CATEGORY_OPTIONS}
          value={item.category}
          onChange={(e) =>
            onUpdate({ category: e.target.value as MediaCategory })
          }
        />
        <Input
          aria-label="City"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onBlur={saveText}
        />
        <Input
          aria-label="Detail"
          placeholder="Material · pattern"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          onBlur={saveText}
          className="sm:col-span-2"
        />
        <Checkbox
          id={`featured-${item.id}`}
          label="Show on the home page"
          checked={item.featured}
          onChange={(e) => onUpdate({ featured: e.target.checked })}
        />
      </div>

      <div className="flex gap-2 sm:flex-col">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMove(-1)}
          disabled={first}
          aria-label="Move up"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMove(1)}
          disabled={last}
          aria-label="Move down"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={confirmDelete}
          aria-label="Delete photo"
        >
          <Trash2 className="h-4 w-4 text-cherokee" />
        </Button>
      </div>
    </li>
  );
};
