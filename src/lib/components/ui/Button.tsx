import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/styles/utils';

type Variant = 'primary' | 'solid' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group inline-flex items-center justify-center gap-2 rounded-tile font-mono text-[0.82rem] font-700 uppercase tracking-[0.14em] transition-all duration-200 focus-visible:outline-cherokee disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  // Cherokee-red clay: the primary "get a quote" action
  primary:
    'bg-cherokee text-bone shadow-paver hover:bg-cherokee-dark hover:-translate-y-0.5 active:translate-y-0',
  // Basalt block
  solid:
    'bg-basalt text-bone hover:bg-basalt-800 hover:-translate-y-0.5 active:translate-y-0',
  // Set-in-stone outline
  outline:
    'border border-basalt/25 bg-transparent text-basalt hover:border-basalt/60 hover:bg-basalt/5',
  ghost: 'text-basalt/70 hover:text-basalt',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-[0.72rem]',
  md: 'px-6 py-3',
  lg: 'px-8 py-4 text-[0.86rem]',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = CommonProps & {
  to: string;
  href?: never;
};

type ButtonAsAnchor = CommonProps & {
  href: string;
  to?: never;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'className' | 'children'>;

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'> & {
    to?: never;
    href?: never;
  };

type ButtonProps = ButtonAsLink | ButtonAsAnchor | ButtonAsButton;

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) => {
  const classes = cn(base, variants[variant], sizes[size], className);

  if ('to' in rest && rest.to !== undefined) {
    const { to, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link to={to} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  if ('href' in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest as ButtonAsAnchor;
    return (
      <a href={href} className={classes} {...anchorRest}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonAsButton)}>
      {children}
    </button>
  );
};
