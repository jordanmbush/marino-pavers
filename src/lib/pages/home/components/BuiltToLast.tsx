import { Droplets, Layers3, ShieldCheck } from 'lucide-react';

import { Anatomy } from '@/lib/components/ui/Anatomy';
import { Reveal } from '@/lib/components/ui/Reveal';
import { SectionHeading } from '@/lib/components/ui/SectionHeading';

const badges = [
  { icon: Layers3, label: 'Base compacted in lifts' },
  { icon: Droplets, label: 'Drainage graded away from the house' },
  { icon: ShieldCheck, label: '2-year workmanship warranty' },
];

export const BuiltToLast = () => {
  return (
    <section className="bg-basalt-900 text-bone">
      <div className="shell py-20 lg:py-28">
        <SectionHeading
          tone="light"
          eyebrow="Built to last"
          title="Anyone can lay pavers. We build the base underneath them."
          lead="A patio is only as good as what you can’t see. Here’s the section most installers cut corners on — and we never do."
        />

        <Reveal className="mt-14">
          <Anatomy />
        </Reveal>

        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-bone/10 pt-8">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-3 text-sm text-sand/80"
            >
              <badge.icon className="h-5 w-5 text-ochre" strokeWidth={2} />
              {badge.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
