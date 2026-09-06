import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Logo } from '@/lib/components/ui/Logo';
import { services } from '@/lib/data/content';
import { nav, serviceAreas, site } from '@/lib/data/site';

const year = new Date().getFullYear();

const Footer = () => {
  return (
    <footer className="mt-auto bg-basalt-950 text-sand">
      <div className="shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          <Logo tone="light" />
          <p className="max-w-xs text-sm leading-relaxed text-sand/65">
            Custom paver patios, driveways, pool decks, artificial turf, and
            outdoor living — engineered from the base up for the Arizona desert.
          </p>
          <div className="flex gap-3">
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Marino Pavers on Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-tile border border-bone/15 text-sand/70 transition-colors hover:border-ochre hover:text-ochre"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Marino Pavers on Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-tile border border-bone/15 text-sand/70 transition-colors hover:border-ochre hover:text-ochre"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="eyebrow text-ochre-light">Services</h4>
          <ul className="flex flex-col gap-2.5">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  to="/services"
                  className="text-sm text-sand/70 transition-colors hover:text-bone"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="eyebrow text-ochre-light">Explore</h4>
          <ul className="flex flex-col gap-2.5">
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-sand/70 transition-colors hover:text-bone"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="eyebrow text-ochre-light">Get in touch</h4>
          <ul className="flex flex-col gap-3 text-sm text-sand/70">
            <li>
              <a
                href={site.phoneHref}
                className="flex items-center gap-3 transition-colors hover:text-bone"
              >
                <Phone className="h-4 w-4 shrink-0 text-ochre" />
                {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={site.emailHref}
                className="flex items-center gap-3 transition-colors hover:text-bone"
              >
                <Mail className="h-4 w-4 shrink-0 text-ochre" />
                {site.email}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-ochre" />
              {site.address.region}
            </li>
            <li className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-ochre" />
              {site.hours}
            </li>
          </ul>
        </div>
      </div>

      <div className="shell">
        <p className="border-t border-bone/10 py-4 text-xs text-sand/50">
          Serving {serviceAreas.slice(0, -1).join(', ')} &amp;{' '}
          {serviceAreas[serviceAreas.length - 1]}.
        </p>
      </div>

      <div className="border-t border-bone/10">
        <div className="shell flex flex-col gap-2 py-6 text-xs text-sand/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="font-mono tracking-wide">
            Licensed · Bonded · Insured — {site.license}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
