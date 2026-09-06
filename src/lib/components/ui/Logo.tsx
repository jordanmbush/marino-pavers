import { Link } from 'react-router-dom';

import { cn } from '@/lib/styles/utils';

type LogoProps = {
  tone?: 'dark' | 'light';
  className?: string;
  /** Render as a plain lockup instead of a home link (e.g. inside the footer). */
  asLink?: boolean;
};

/**
 * Brand mark: four paver bricks in a basketweave — the simplest pattern a
 * mason lays — with a single clay-red accent brick. Wordmark set in the
 * display face over a mono locale line.
 */
const Mark = ({ tone }: { tone: 'dark' | 'light' }) => {
  const brick = tone === 'light' ? '#F3ECDE' : '#211C17';
  const accent = tone === 'light' ? '#CD854A' : '#A8432B';
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* top-left: horizontal pair */}
      <rect x="4" y="4" width="11" height="5" rx="1" fill={brick} />
      <rect x="4" y="10" width="11" height="5" rx="1" fill={brick} />
      {/* top-right: vertical pair (accent brick) */}
      <rect x="17" y="4" width="5" height="11" rx="1" fill={accent} />
      <rect x="23" y="4" width="5" height="11" rx="1" fill={brick} />
      {/* bottom-left: vertical pair */}
      <rect x="4" y="17" width="5" height="11" rx="1" fill={brick} />
      <rect x="10" y="17" width="5" height="11" rx="1" fill={brick} />
      {/* bottom-right: horizontal pair */}
      <rect x="17" y="17" width="11" height="5" rx="1" fill={brick} />
      <rect x="17" y="23" width="11" height="5" rx="1" fill={brick} />
    </svg>
  );
};

export const Logo = ({
  tone = 'dark',
  className,
  asLink = true,
}: LogoProps) => {
  const text = tone === 'light' ? 'text-bone' : 'text-basalt';
  const sub = tone === 'light' ? 'text-sand/60' : 'text-basalt/50';

  const inner = (
    <span className={cn('flex items-center gap-3', className)}>
      <Mark tone={tone} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-[1.15rem] font-800 tracking-[0.02em]',
            text
          )}
        >
          MARINO
        </span>
        <span
          className={cn('eyebrow mt-1 text-[0.6rem] tracking-[0.3em]', sub)}
        >
          Pavers · Phoenix
        </span>
      </span>
    </span>
  );

  if (!asLink) return inner;

  return (
    <Link to="/" aria-label="Marino Pavers — home" className="inline-flex">
      {inner}
    </Link>
  );
};
