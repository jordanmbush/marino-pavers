import type { ReactNode } from 'react';

import { cn } from '@/lib/styles/utils';

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
  children?: ReactNode;
};

/**
 * Eyebrow (mono label) + display title + optional lead. `tone="light"` inverts
 * the colors for use on basalt sections.
 */
export const SectionHeading = ({
  eyebrow,
  title,
  lead,
  align = 'left',
  tone = 'dark',
  className,
  children,
}: SectionHeadingProps) => {
  const onDark = tone === 'light';
  return (
    <div
      className={cn(
        'flex max-w-2xl flex-col gap-4',
        align === 'center' && 'mx-auto items-center text-center',
        className
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            'eyebrow flex items-center gap-3',
            onDark ? 'text-ochre-light' : 'text-cherokee'
          )}
        >
          <span
            className={cn(
              'h-px w-8',
              onDark ? 'bg-ochre-light/60' : 'bg-cherokee/50'
            )}
          />
          {eyebrow}
        </span>
      ) : null}

      <h2
        className={cn(
          'text-[1.9rem] leading-[1.05] sm:text-4xl lg:text-[2.75rem]',
          onDark ? 'text-bone' : 'text-basalt'
        )}
      >
        {title}
      </h2>

      {lead ? (
        <p
          className={cn(
            'text-base leading-relaxed sm:text-lg',
            onDark ? 'text-sand/75' : 'text-basalt/70'
          )}
        >
          {lead}
        </p>
      ) : null}

      {children}
    </div>
  );
};
