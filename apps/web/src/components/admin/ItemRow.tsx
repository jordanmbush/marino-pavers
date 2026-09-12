import { ArrowDown, ArrowUp, Check, LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  MEDIA_CATEGORIES,
  draftOf,
  editablePatch,
  turn,
  type EditableItem,
  type ItemDraft,
  type MediaCategory,
  type MediaItem,
} from "@marino/domain";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Thumbnail } from "./Thumbnail";

type Props = {
  item: MediaItem;
  first: boolean;
  last: boolean;
  /** Resolves true once the patch is stored; false when it failed (the library shows why). */
  onUpdate: (patch: EditableItem) => Promise<boolean>;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
};

const CATEGORY_OPTIONS = MEDIA_CATEGORIES.map((c) => ({
  value: c.slug,
  label: c.label,
}));

/**
 * One photo's editor. Edits sit in a draft until Save — the button wakes up
 * as soon as something differs from what's stored. Turning the photo is an
 * edit too: it previews at once and re-renders on save. Move and delete act
 * immediately; they're actions, not edits.
 */
export const ItemRow = ({
  item,
  first,
  last,
  onUpdate,
  onMove,
  onDelete,
}: Props) => {
  const [draft, setDraft] = useState<ItemDraft>(() => draftOf(item));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const patch = editablePatch(item, draft);
  const dirty = Object.keys(patch).length > 0;

  const edit = (change: Partial<ItemDraft>) => {
    setDraft((current) => ({ ...current, ...change }));
    setSaved(false);
  };

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    const stored = await onUpdate(patch);
    setSaving(false);
    // Edits typed while the request was out stay dirty: `saved` only shows
    // once the draft and the stored item agree again.
    if (stored) setSaved(true);
  };

  const saveOnEnter = (event: { key: string; preventDefault(): void }) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void save();
    }
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
    <li className="grid gap-4 rounded-tile border border-taupe-900/10 bg-white p-4 sm:grid-cols-[160px_1fr_auto]">
      <Thumbnail
        item={item}
        rotation={draft.rotation}
        onTurn={(delta) => edit({ rotation: turn(draft.rotation, delta) })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          aria-label="Title"
          placeholder="Title (e.g. Desert Ridge patio)"
          value={draft.title}
          onChange={(e) => edit({ title: e.target.value })}
          onKeyDown={saveOnEnter}
          className="sm:col-span-2"
        />
        <Select
          aria-label="Category"
          options={CATEGORY_OPTIONS}
          value={draft.category}
          onChange={(e) => edit({ category: e.target.value as MediaCategory })}
        />
        <Input
          aria-label="City"
          placeholder="City"
          value={draft.city}
          onChange={(e) => edit({ city: e.target.value })}
          onKeyDown={saveOnEnter}
        />
        <Input
          aria-label="Detail"
          placeholder="Material · pattern"
          value={draft.detail}
          onChange={(e) => edit({ detail: e.target.value })}
          onKeyDown={saveOnEnter}
          className="sm:col-span-2"
        />
        <Checkbox
          id={`featured-${item.id}`}
          label="Show on the home page"
          checked={draft.featured}
          onChange={(e) => edit({ featured: e.target.checked })}
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
          <Trash2 className="h-4 w-4 text-taupe-700" />
        </Button>
        <Button
          size="sm"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="ml-auto min-w-30 sm:ml-0"
        >
          {saving ? (
            <>
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Saving…
            </>
          ) : saved && !dirty ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Saved
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </li>
  );
};
