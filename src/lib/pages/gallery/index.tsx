import { useState } from 'react';
import { Helmet } from 'react-helmet';

import { CtaBand } from '@/lib/components/ui/CtaBand';
import { PageHero } from '@/lib/components/ui/PageHero';
import { ProjectTile } from '@/lib/components/ui/ProjectTile';
import { Reveal } from '@/lib/components/ui/Reveal';
import { projectCategories, projects } from '@/lib/data/content';
import { cn } from '@/lib/styles/utils';

const Gallery = () => {
  const [active, setActive] =
    useState<(typeof projectCategories)[number]>('All');

  const filtered =
    active === 'All' ? projects : projects.filter((p) => p.category === active);

  return (
    <>
      <Helmet>
        <title>
          Our Work — Paver &amp; Turf Projects Across Phoenix | Marino Pavers
        </title>
      </Helmet>

      <PageHero
        eyebrow="Our work"
        title="Laid across the Valley, one yard at a time."
        lead="Patios, driveways, pool decks, and turf from Cave Creek to Queen Creek. Filter by what you’re planning."
      />

      <section className="bg-sand">
        <div className="shell py-14 lg:py-20">
          {/* Filter */}
          <div
            className="flex flex-wrap gap-2.5"
            role="group"
            aria-label="Filter projects by category"
          >
            {projectCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                aria-pressed={active === cat}
                className={cn(
                  'eyebrow rounded-tile border px-4 py-2.5 transition-colors',
                  active === cat
                    ? 'border-basalt bg-basalt text-bone'
                    : 'border-basalt/15 bg-bone text-basalt/60 hover:border-basalt/40 hover:text-basalt'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project, i) => (
              <Reveal key={project.title} delay={(i % 3) * 80}>
                <ProjectTile project={project} />
              </Reveal>
            ))}
          </div>

          <p className="mt-10 max-w-2xl font-mono text-xs leading-relaxed text-basalt/50">
            Showing {filtered.length} of {projects.length} recent projects. Want
            to see something specific — a paver line, a pattern, a whole
            backyard? Ask and we’ll send photos from jobs like yours.
          </p>
        </div>
      </section>

      <CtaBand
        eyebrow="Your yard next"
        title="See something you want in your own backyard?"
        lead="Send us a photo of your space and a note on what you’re after. We’ll follow up with ideas and an honest quote."
      />
    </>
  );
};

export default Gallery;
