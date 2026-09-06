import type { ReactNode } from 'react';

import { cn } from '@/lib/styles/utils';

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
};

/** Consistent header band for interior pages. */
export const PageHero = ({ eyebrow, title, lead, children }: PageHeroProps) => {
  return (
    <section className="relative overflow-hidden border-b border-basalt/10 bg-sand-light">
      {/* faint herringbone texture bleeding in from the right */}
      <div
        className="herringbone pointer-events-none absolute -right-16 top-0 hidden h-full w-1/3 opacity-[0.08] md:block"
        aria-hidden="true"
        style={{
          maskImage: 'linear-gradient(to left, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to left, black, transparent)',
        }}
      />
      <div className="shell relative py-16 sm:py-20 lg:py-24">
        <span className="eyebrow flex items-center gap-3 text-cherokee">
          <span className="h-px w-8 bg-cherokee/50" />
          {eyebrow}
        </span>
        <h1
          className={cn(
            'mt-5 max-w-3xl text-[2.4rem] leading-[1.02] sm:text-5xl lg:text-6xl'
          )}
        >
          {title}
        </h1>
        {lead ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-basalt/70">
            {lead}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
};
