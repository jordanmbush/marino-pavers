import { CalendarDays, ShieldCheck, Star } from 'lucide-react';

import { Button } from '@/lib/components/ui/Button';
import { PaverField } from '@/lib/components/ui/PaverField';
import { site } from '@/lib/data/site';

const trust = [
  { icon: ShieldCheck, label: 'Licensed, bonded & insured' },
  { icon: Star, label: '4.9★ · 180+ reviews' },
  { icon: CalendarDays, label: 'Est. 2009' },
];

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-sand">
      <div className="shell grid items-center gap-12 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
        <div className="relative z-10 flex flex-col gap-6">
          <span
            className="eyebrow flex animate-rise items-center gap-3 text-cherokee"
            style={{ animationDelay: '0ms' }}
          >
            <span className="h-px w-10 bg-cherokee/50" />
            Pavers · Turf · Outdoor Living
          </span>

          <h1
            className="animate-rise text-[2.7rem] leading-[0.98] sm:text-6xl lg:text-[4.25rem]"
            style={{ animationDelay: '90ms' }}
          >
            Outdoor spaces
            <br />
            <span className="text-cherokee">built to outlast</span>
            <br />
            the desert.
          </h1>

          <p
            className="max-w-lg animate-rise text-lg leading-relaxed text-basalt/70"
            style={{ animationDelay: '180ms' }}
          >
            Marino Pavers designs and installs custom patios, driveways, pool
            decks, and artificial turf across the Valley — engineered from the
            base up to take Arizona heat, monsoon, and time.
          </p>

          <div
            className="mt-2 flex animate-rise flex-wrap gap-4"
            style={{ animationDelay: '260ms' }}
          >
            <Button to="/contact" size="lg">
              Get a free quote
            </Button>
            <Button to="/gallery" variant="outline" size="lg">
              See our work
            </Button>
          </div>

          <ul
            className="mt-4 flex animate-rise flex-wrap gap-x-6 gap-y-3"
            style={{ animationDelay: '340ms' }}
          >
            {trust.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 text-sm text-basalt/70"
              >
                <item.icon
                  className="h-4 w-4 text-cherokee"
                  strokeWidth={2.2}
                />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* The signature: a paver field receding toward the horizon */}
        <div
          className="relative h-[300px] animate-rise sm:h-[420px] lg:h-[560px]"
          style={{ animationDelay: '140ms' }}
        >
          <PaverField className="rounded-tile" />
          <div className="absolute bottom-5 left-5 rounded-tile border border-basalt/10 bg-bone/95 px-4 py-3 shadow-paver backdrop-blur">
            <span className="eyebrow text-cherokee">Herringbone lay</span>
            <p className="mt-1 font-display text-sm font-800 text-basalt">
              Driveway · Scottsdale
            </p>
          </div>
        </div>
      </div>

      <a href={site.phoneHref} className="sr-only">
        Call {site.name}
      </a>
    </section>
  );
};
