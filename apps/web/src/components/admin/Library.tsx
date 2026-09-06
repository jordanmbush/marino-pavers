import { Button } from "@/components/ui/Button";
import { ItemRow } from "./ItemRow";
import { UploadPanel } from "./UploadPanel";
import { useLibrary } from "./useLibrary";

type Props = { username: string; onSignOut: () => void };

export const Library = ({ username, onSignOut }: Props) => {
  const { client, items, error, refresh, update, move, remove } =
    useLibrary(onSignOut);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow text-cherokee">Photo library</span>
          <h1 className="mt-2 text-3xl">Our Work</h1>
          <p className="mt-1 text-sm text-basalt/60">
            Photos appear on the site a minute or so after upload. Signed in as{" "}
            {username}.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <UploadPanel client={client} onUploaded={() => void refresh()} />

      {error && (
        <p
          className="rounded-tile border border-cherokee/30 bg-cherokee/5 px-4 py-3 text-sm text-cherokee"
          role="alert"
        >
          {error}
        </p>
      )}

      {items === null ? (
        <p className="font-mono text-xs text-basalt/50">Loading photos…</p>
      ) : items.length === 0 ? (
        <p className="rounded-tile border border-dashed border-basalt/20 p-8 text-center text-sm text-basalt/60">
          No photos yet. Upload the first batch above.
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {items.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              first={i === 0}
              last={i === items.length - 1}
              onUpdate={(patch) => update(item.id, patch)}
              onMove={(delta) => void move(item.id, delta)}
              onDelete={() => void remove(item.id)}
            />
          ))}
        </ol>
      )}
    </div>
  );
};
