import { Quote } from 'lucide-react';

import { Reveal } from '@/lib/components/ui/Reveal';
import { SectionHeading } from '@/lib/components/ui/SectionHeading';
import { testimonials } from '@/lib/data/content';

export const Testimonials = () => {
  return (
    <section className="bg-basalt-950 text-bone">
      <div className="shell py-20 lg:py-28">
        <SectionHeading
          tone="light"
          eyebrow="From the Valley"
          title="Homeowners who stopped putting it off."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="flex h-full flex-col gap-6 rounded-tile border border-bone/10 bg-basalt-900 p-8">
                <Quote className="h-8 w-8 text-ochre" strokeWidth={1.6} />
                <blockquote className="flex-1 text-[1.05rem] leading-relaxed text-sand/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="border-t border-bone/10 pt-5">
                  <p className="font-display text-base font-800 text-bone">
                    {t.name}
                  </p>
                  <p className="eyebrow mt-1 text-ochre-light">
                    {t.city} · {t.project}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
