import { cn } from "@/components/ui/cn";

const TILES = [
  ["#CBB58A", "#9C8158"],
  ["#4E4336", "#211C17"],
  ["#EDE3D2", "#C7AB7C"],
  ["#71755B", "#585B45"],
  ["#CD854A", "#8E3421"],
  ["#C0563D", "#8E3421"],
] as const;

type Props = { count?: number; message: string };

/** What the grid shows before the client has uploaded anything. */
export const EmptyTiles = ({ count = 3, message }: Props) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {TILES.slice(0, count).map(([from, to], i) => (
      <div
        key={from}
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-tile border border-basalt/10 shadow-paver",
          i === 0 && "flex items-end",
        )}
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
        aria-hidden={i !== 0}
      >
        <div className="absolute inset-0 herringbone opacity-20 mix-blend-overlay" />
        {i === 0 && (
          <p className="relative m-5 rounded-tile bg-bone/90 px-3 py-2 font-mono text-xs text-basalt">
            {message}
          </p>
        )}
      </div>
    ))}
  </div>
);
