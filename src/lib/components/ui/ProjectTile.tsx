import { MapPin } from 'lucide-react';

import type { Project } from '@/lib/data/content';
import { cn } from '@/lib/styles/utils';

/**
 * A project card. The gradient + herringbone texture stands in for a real
 * photo — swap the `<div>` fill for an `<img>` once project photography is in.
 */
export const ProjectTile = ({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) => {
  return (
    <figure
      className={cn(
        'group relative overflow-hidden rounded-tile border border-basalt/10 shadow-paver',
        className
      )}
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${project.from}, ${project.to})`,
        }}
      >
        {/* paver texture */}
        <div className="herringbone absolute inset-0 opacity-20 mix-blend-overlay transition-transform duration-700 group-hover:scale-105" />
        {/* legibility scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-basalt/80 via-basalt/10 to-transparent" />

        <span className="eyebrow absolute left-4 top-4 rounded-tile bg-bone/90 px-2.5 py-1 text-[0.6rem] text-basalt">
          {project.category}
        </span>
      </div>

      <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5">
        <span className="font-display text-lg font-800 leading-tight text-bone">
          {project.title}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-sand/80">
          <MapPin className="h-3 w-3" />
          {project.city}
          <span className="text-sand/40">·</span>
          <span className="font-mono">{project.detail}</span>
        </span>
      </figcaption>
    </figure>
  );
};
