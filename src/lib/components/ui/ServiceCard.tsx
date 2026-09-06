import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Service } from '@/lib/data/content';

export const ServiceCard = ({ service }: { service: Service }) => {
  const Icon = service.icon;
  return (
    <Link
      to="/services"
      className="group flex flex-col gap-4 rounded-tile border border-basalt/10 bg-bone p-7 shadow-seam transition-all duration-200 hover:-translate-y-1 hover:border-basalt/25 hover:shadow-paver"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-basalt text-bone transition-colors group-hover:bg-cherokee">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <ArrowUpRight className="h-5 w-5 text-basalt/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cherokee" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl">{service.title}</h3>
        <p className="eyebrow text-cherokee">{service.tagline}</p>
      </div>
      <p className="text-sm leading-relaxed text-basalt/65">
        {service.description}
      </p>
    </Link>
  );
};
