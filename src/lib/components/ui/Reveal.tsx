import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/styles/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger in ms — lets a row of cards settle in sequence. */
  delay?: number;
  as?: ElementType;
  id?: string;
};

/**
 * Reveals its children as they scroll into view: they start settled a little
 * low and rise into place. Fires once, respects reduced motion (handled in CSS).
 */
export const Reveal = ({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  id,
}: RevealProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // No IntersectionObserver (or SSR) → just show the content.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
};
