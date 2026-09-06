import { Check } from 'lucide-react';
import { Helmet } from 'react-helmet';

import { CtaBand } from '@/lib/components/ui/CtaBand';
import { FaqList } from '@/lib/components/ui/FaqList';
import { PageHero } from '@/lib/components/ui/PageHero';
import { Reveal } from '@/lib/components/ui/Reveal';
import { SectionHeading } from '@/lib/components/ui/SectionHeading';
import { faqs, services } from '@/lib/data/content';
import { cn } from '@/lib/styles/utils';

// Material swatch gradients that pair with each service panel
const swatches = [
  ['#CBB58A', '#9C8158'],
  ['#4E4336', '#211C17'],
  ['#71755B', '#585B45'],
  ['#EDE3D2', '#C7AB7C'],
  ['#D0B98C', '#A98B5E'],
  ['#CD854A', '#8E3421'],
];

const Services = () => {
  return (
    <>
      <Helmet>
        <title>
          Services — Paver Patios, Driveways, Turf &amp; More | Marino Pavers
        </title>
      </Helmet>

      <PageHero
        eyebrow="Services"
        title="Everything that turns bare dirt into a destination."
        lead="Six specialties, one crew. Whether it’s a single walkway or a full backyard build, the base work and finish detail are the same — done right."
      />

      <div className="bg-sand">
        <div className="shell flex flex-col gap-24 py-20 lg:gap-28 lg:py-28">
          {services.map((service, i) => {
            const Icon = service.icon;
            const [from, to] = swatches[i % swatches.length];
            const flip = i % 2 === 1;
            return (
              <Reveal
                key={service.slug}
                id={service.slug}
                className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                {/* Material swatch panel */}
                <div
                  className={cn(
                    'relative order-first aspect-[5/4] overflow-hidden rounded-tile border border-basalt/10 shadow-paver',
                    flip && 'lg:order-last'
                  )}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
                  }}
                >
                  <div className="herringbone absolute inset-0 opacity-25 mix-blend-overlay" />
                  <span className="eyebrow absolute bottom-5 left-5 rounded-tile bg-bone/90 px-3 py-1.5 text-basalt">
                    {service.tagline}
                  </span>
                </div>

                {/* Copy */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-basalt text-bone">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="eyebrow text-cherokee">
                      0{i + 1} / {service.tagline}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl">{service.title}</h2>
                  <p className="max-w-xl leading-relaxed text-basalt/70">
                    {service.description}
                  </p>
                  <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-basalt/80"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-cherokee"
                          strokeWidth={2.4}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <section className="bg-sand-light">
        <div className="shell grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
          <SectionHeading
            eyebrow="Good questions"
            title="Answers before you ask."
            lead="The things Valley homeowners want to know before they commit."
          />
          <FaqList items={faqs} />
        </div>
      </section>

      <CtaBand />
    </>
  );
};

export default Services;
