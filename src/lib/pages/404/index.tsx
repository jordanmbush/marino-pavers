import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';

import { Button } from '@/lib/components/ui/Button';
import { nav } from '@/lib/data/site';

const Page404 = () => {
  return (
    <>
      <Helmet>
        <title>Page not found — Marino Pavers</title>
      </Helmet>

      <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-sand">
        <div
          className="herringbone pointer-events-none absolute inset-0 opacity-[0.07]"
          aria-hidden="true"
        />
        <div className="shell relative flex flex-col items-start gap-6 py-24">
          <span className="eyebrow flex items-center gap-3 text-cherokee">
            <span className="h-px w-10 bg-cherokee/50" />
            Error 404
          </span>
          <h1 className="text-[2.75rem] leading-[0.98] sm:text-6xl lg:text-8xl">
            This path leads
            <br />
            <span className="text-cherokee">nowhere.</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-basalt/70">
            Looks like this one washed out. Every other path on the site is on
            solid ground — head back and pick one.
          </p>

          <div className="mt-2 flex flex-wrap gap-4">
            <Button to="/" size="lg">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Button>
            <Button to="/contact" variant="outline" size="lg">
              Get a quote
            </Button>
          </div>

          <nav
            className="mt-6 flex flex-wrap gap-x-6 gap-y-2"
            aria-label="Site pages"
          >
            {nav.map((item) => (
              <Button key={item.to} to={item.to} variant="ghost" size="sm">
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
};

export default Page404;
