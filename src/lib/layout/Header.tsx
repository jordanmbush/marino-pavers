import { Menu, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { Button } from '@/lib/components/ui/Button';
import { Logo } from '@/lib/components/ui/Logo';
import { nav, site } from '@/lib/data/site';
import { cn } from '@/lib/styles/utils';

const Header = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'eyebrow py-1 text-[0.7rem] transition-colors',
      isActive ? 'text-cherokee' : 'text-basalt/60 hover:text-basalt'
    );

  return (
    <header className="sticky top-0 z-50 border-b border-basalt/10 bg-sand/85 backdrop-blur-md">
      <div className="shell flex h-[4.5rem] items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={site.phoneHref}
            className="eyebrow flex items-center gap-2 text-[0.7rem] text-basalt/70 transition-colors hover:text-basalt"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={2.4} />
            {site.phoneDisplay}
          </a>
          <Button to="/contact" size="sm">
            Free quote
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-tile border border-basalt/15 text-basalt lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'overflow-hidden border-t border-basalt/10 bg-sand transition-[max-height] duration-300 ease-out lg:hidden',
          open ? 'max-h-[26rem]' : 'max-h-0'
        )}
      >
        <div className="shell flex flex-col gap-1 py-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between border-b border-basalt/10 py-3 font-display text-lg font-800',
                  isActive ? 'text-cherokee' : 'text-basalt'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="mt-4 flex flex-col gap-3">
            <a
              href={site.phoneHref}
              className="eyebrow flex items-center gap-2 text-basalt/70"
            >
              <Phone className="h-4 w-4" strokeWidth={2.4} />
              {site.phoneDisplay}
            </a>
            <Button to="/contact" size="md" className="w-full">
              Get a free quote
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
