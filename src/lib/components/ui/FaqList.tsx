import { Minus, Plus } from 'lucide-react';

import type { Faq } from '@/lib/data/content';

/**
 * No-JS accordion built on native <details>/<summary> — keyboard-accessible
 * and works before hydration.
 */
export const FaqList = ({ items }: { items: Faq[] }) => {
  return (
    <div className="border-basalt/12 border-t">
      {items.map((item) => (
        <details key={item.q} className="border-basalt/12 group border-b py-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden">
            <span className="font-display text-lg font-800 text-basalt">
              {item.q}
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-tile border border-basalt/15 text-basalt transition-colors group-open:bg-cherokee group-open:text-bone">
              <Plus className="h-4 w-4 group-open:hidden" />
              <Minus className="hidden h-4 w-4 group-open:block" />
            </span>
          </summary>
          <p className="max-w-2xl pb-4 leading-relaxed text-basalt/70">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
};
