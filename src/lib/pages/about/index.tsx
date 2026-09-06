import { Award, Handshake, HardHat, ShieldCheck, Users } from 'lucide-react';
import { Helmet } from 'react-helmet';

import { CtaBand } from '@/lib/components/ui/CtaBand';
import { PageHero } from '@/lib/components/ui/PageHero';
import { Reveal } from '@/lib/components/ui/Reveal';
import { SectionHeading } from '@/lib/components/ui/SectionHeading';
import { stats } from '@/lib/data/site';

const values = [
  {
    icon: HardHat,
    title: 'Base work, never skipped',
    body: 'The layers you can’t see are the ones that fail. We excavate, grade, and compact in lifts on every job — no shortcuts under the pretty part.',
  },
  {
    icon: Users,
    title: 'Our crew, never subbed',
    body: 'The people who quote your job are the people who build it. We don’t hand your yard to the lowest day-labor bidder.',
  },
  {
    icon: Handshake,
    title: 'Straight talk, itemized',
    body: 'Every quote is line-itemed so you know exactly what you’re paying for. No vague ballparks, no surprise change orders.',
  },
  {
    icon: ShieldCheck,
    title: 'Warrantied, in writing',
    body: 'Two-year workmanship warranty on top of the manufacturer’s paver warranty. We stand behind the work long after the trucks leave.',
  },
];

const credentials = [
  { icon: Award, label: 'ICPI-certified installers' },
  { icon: ShieldCheck, label: 'Licensed, bonded & insured — AZ ROC #327845' },
  { icon: Handshake, label: '2-year workmanship warranty' },
];

const About = () => {
  return (
    <>
      <Helmet>
        <title>About — Family-Run Phoenix Paver Crew | Marino Pavers</title>
      </Helmet>

      <PageHero
        eyebrow="About"
        title="A Phoenix crew that treats your yard like our own."
        lead="Family-run since 2009, still laying our own base, still refusing to cut the corners you’d never see."
      />

      {/* Story */}
      <section className="bg-sand">
        <div className="shell grid gap-12 py-20 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:py-28">
          <Reveal className="flex flex-col gap-5">
            <SectionHeading
              eyebrow="Our story"
              title="Started over one cracked patio too many."
            />
            <div className="flex flex-col gap-4 leading-relaxed text-basalt/75">
              <p>
                Marino Pavers started in 2009 with one truck, a plate compactor,
                and a simple frustration: too many Valley homeowners were paying
                for patios that cracked, heaved, or washed out after the first
                monsoon — because the crew before us skipped the base.
              </p>
              <p>
                We’d spent years on commercial hardscape crews, where the base
                work is non-negotiable, and brought that same standard home to
                residential driveways and backyards. The finish is what you see;
                the base is why it lasts.
              </p>
              <p>
                More than a decade and 600-plus projects later, we’re still
                family-run, still compacting every base in lifts, and still
                showing up with the same crew that shook your hand at the quote.
              </p>
            </div>
          </Reveal>

          <Reveal
            delay={120}
            className="grid grid-cols-2 gap-4 self-start rounded-tile border border-basalt/10 bg-bone p-8 shadow-paver"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 py-3">
                <span className="font-display text-3xl font-800 text-basalt">
                  {stat.value}
                </span>
                <span className="eyebrow text-cherokee">{stat.label}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="bg-basalt-950 text-bone">
        <div className="shell py-20 lg:py-28">
          <SectionHeading
            tone="light"
            eyebrow="How we work"
            title="Four things we won’t compromise on."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={(i % 2) * 100}>
                <div className="flex h-full gap-5 rounded-tile border border-bone/10 bg-basalt-900 p-8">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-tile bg-cherokee text-bone">
                    <value.icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl text-bone">{value.title}</h3>
                    <p className="text-sm leading-relaxed text-sand/70">
                      {value.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="bg-sand-light">
        <div className="shell flex flex-wrap items-center justify-center gap-x-12 gap-y-5 py-12">
          {credentials.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-3 text-sm font-700 text-basalt/75"
            >
              <c.icon className="h-5 w-5 text-cherokee" strokeWidth={2} />
              {c.label}
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
};

export default About;
