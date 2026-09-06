import { MapPin } from 'lucide-react';

import { Button } from '@/lib/components/ui/Button';
import { Reveal } from '@/lib/components/ui/Reveal';
import { SectionHeading } from '@/lib/components/ui/SectionHeading';
import { serviceAreas } from '@/lib/data/site';

export const ServiceArea = () => {
  return (
    <section className="bg-sand-light">
      <div className="shell grid gap-12 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:py-28">
        <SectionHeading
          eyebrow="Where we work"
          title="Building across greater Phoenix."
          lead="From Cave Creek down to Queen Creek, we cover the Valley. Don’t see your city? Ask — we travel for the right project."
        >
          <div className="mt-8">
            <Button to="/contact">Check my address</Button>
          </div>
        </SectionHeading>

        <Reveal className="flex flex-wrap gap-3">
          {serviceAreas.map((area) => (
            <span
              key={area}
              className="border-basalt/12 flex items-center gap-2 rounded-tile border bg-bone px-4 py-2.5 text-sm text-basalt/80"
            >
              <MapPin className="h-3.5 w-3.5 text-cherokee" />
              {area}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
};
