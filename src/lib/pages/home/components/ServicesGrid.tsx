import { Reveal } from '@/lib/components/ui/Reveal';
import { SectionHeading } from '@/lib/components/ui/SectionHeading';
import { ServiceCard } from '@/lib/components/ui/ServiceCard';
import { services } from '@/lib/data/content';

export const ServicesGrid = () => {
  return (
    <section className="bg-sand">
      <div className="shell py-20 lg:py-28">
        <SectionHeading
          eyebrow="What we build"
          title="Six ways to live better outside."
          lead="Every surface engineered for the desert, laid by our own crews — never subbed out to the lowest bidder."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={(i % 3) * 90}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
