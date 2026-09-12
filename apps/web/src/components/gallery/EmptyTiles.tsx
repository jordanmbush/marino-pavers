type Props = { count?: number; message: string };

/** What the grid shows before the client has uploaded anything: blank prints, one captioned. */
export const EmptyTiles = ({ count = 3, message }: Props) => (
  <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex flex-col gap-3" aria-hidden={i !== 0}>
        <div className="aspect-[4/3] rounded-tile border border-taupe-200 bg-taupe-50" />
        {i === 0 && (
          <p className="text-lg leading-snug text-taupe-600">{message}</p>
        )}
      </div>
    ))}
  </div>
);
