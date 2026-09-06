import { Phone } from 'lucide-react';

import { site } from '@/lib/data/site';

import { Button } from './Button';
import { Reveal } from './Reveal';

type CtaBandProps = {
  eyebrow?: string;
  title?: string;
  lead?: string;
};

export const CtaBand = ({
  eyebrow = 'Free on-site quote',
  title = 'Let’s build something you’ll actually use outside.',
  lead = 'Tell us about your space and we’ll walk it with you, bring samples, and leave you with an honest, itemized quote — no pressure.',
}: CtaBandProps) => {
  return (
    <section className="relative overflow-hidden bg-basalt-950 text-bone">
      {/* a herringbone seam runs along the top edge */}
      <div className="herringbone h-2 w-full opacity-70" />

      <div className="shell grid gap-10 py-20 lg:grid-cols-[1.5fr_1fr] lg:items-center">
        <Reveal className="flex flex-col gap-6">
          <span className="eyebrow flex items-center gap-3 text-ochre-light">
            <span className="h-px w-8 bg-ochre-light/60" />
            {eyebrow}
          </span>
          <h2 className="text-[2rem] leading-[1.05] sm:text-4xl lg:text-[2.9rem]">
            {title}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-sand/75 sm:text-lg">
            {lead}
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            <Button to="/contact" size="lg">
              Get my free quote
            </Button>
            <Button
              href={site.phoneHref}
              variant="outline"
              size="lg"
              className="border-bone/30 text-bone hover:border-bone hover:bg-bone/10"
            >
              <Phone className="h-4 w-4" strokeWidth={2.4} />
              Call now
            </Button>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-tile border border-bone/15 bg-basalt-900 p-8 shadow-paver-lg">
            <span className="eyebrow text-sand/50">Prefer to talk?</span>
            <a
              href={site.phoneHref}
              className="mt-3 block font-display text-3xl font-800 text-bone transition-colors hover:text-ochre-light sm:text-[2.1rem]"
            >
              {site.phoneDisplay}
            </a>
            <p className="mt-4 border-t border-bone/10 pt-4 text-sm text-sand/60">
              {site.hours}
            </p>
            <p className="mt-1 text-sm text-sand/60">
              Serving {site.address.region}.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
