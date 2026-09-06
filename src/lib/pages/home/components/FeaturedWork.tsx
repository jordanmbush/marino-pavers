import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ProjectTile } from '@/lib/components/ui/ProjectTile';
import { Reveal } from '@/lib/components/ui/Reveal';
import { SectionHeading } from '@/lib/components/ui/SectionHeading';
import { projects } from '@/lib/data/content';

export const FeaturedWork = () => {
  const featured = projects.slice(0, 3);
  return (
    <section className="bg-sand">
      <div className="shell py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Recent work"
            title="Built across the Valley."
            lead="A few backyards, driveways, and pool decks we’ve wrapped up lately."
          />
          <Link
            to="/gallery"
            className="eyebrow group flex items-center gap-2 text-cherokee hover:text-cherokee-dark"
          >
            View all projects
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, i) => (
            <Reveal key={project.title} delay={i * 90}>
              <ProjectTile project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
