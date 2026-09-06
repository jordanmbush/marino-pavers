import { Reveal } from '@/lib/components/ui/Reveal';
import { SectionHeading } from '@/lib/components/ui/SectionHeading';
import { process } from '@/lib/data/content';

export const ProcessSection = () => {
  return (
    <section className="bg-sand-light">
      <div className="shell py-20 lg:py-28">
        <SectionHeading
          eyebrow="How it goes"
          title="From first walkthrough to warranty."
          lead="Five steps, one crew, no mystery. You’ll always know what’s happening in your yard and what comes next."
        />

        <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {process.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal
                as="li"
                key={step.n}
                delay={i * 90}
                className="relative flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-3xl font-800 text-cherokee">
                    {step.n}
                  </span>
                  <span className="h-px flex-1 bg-basalt/15" />
                  <Icon className="h-5 w-5 text-basalt/50" strokeWidth={2} />
                </div>
                <h3 className="text-xl leading-tight">{step.title}</h3>
                <p className="text-sm leading-relaxed text-basalt/65">
                  {step.body}
                </p>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
