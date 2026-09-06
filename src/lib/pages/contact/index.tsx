import { Check, Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Helmet } from 'react-helmet';

import { Button } from '@/lib/components/ui/Button';
import { PageHero } from '@/lib/components/ui/PageHero';
import { services } from '@/lib/data/content';
import { site } from '@/lib/data/site';
import { cn } from '@/lib/styles/utils';

const projectOptions = [
  ...services.map((s) => s.title),
  'Something else / not sure yet',
];

const budgetOptions = [
  'Under $5k',
  '$5k – $15k',
  '$15k – $30k',
  '$30k+',
  'Not sure yet',
];

type FormState = {
  name: string;
  phone: string;
  email: string;
  city: string;
  project: string;
  budget: string;
  details: string;
};

const EMPTY: FormState = {
  name: '',
  phone: '',
  email: '',
  city: '',
  project: '',
  budget: '',
  details: '',
};

const fieldClass =
  'w-full rounded-tile border border-basalt/15 bg-sand-light px-4 py-3 text-basalt placeholder:text-basalt/35 focus:border-cherokee focus:outline-none focus:ring-2 focus:ring-cherokee/25';

const labelClass = 'eyebrow mb-2 block text-basalt/60';

const Contact = () => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const update =
    (key: keyof FormState) =>
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Tell us your name.';
    if (!form.phone.trim() && !form.email.trim()) {
      next.contact = 'Add a phone or email so we can reach you.';
    }
    if (!form.details.trim()) {
      next.details = 'A sentence or two about the project helps us quote it.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const subject = `Quote request — ${form.project || 'Paver project'}${
      form.city ? `, ${form.city}` : ''
    }`;
    const body = [
      `Name: ${form.name}`,
      `Phone: ${form.phone || '—'}`,
      `Email: ${form.email || '—'}`,
      `City: ${form.city || '—'}`,
      `Project: ${form.project || '—'}`,
      `Budget: ${form.budget || '—'}`,
      '',
      'Details:',
      form.details,
    ].join('\n');

    // Static site, no backend: hand off to the visitor's mail client.
    // Swap this for a Netlify/Formspree endpoint if server delivery is wanted.
    window.location.href = `${site.emailHref}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <>
      <Helmet>
        <title>Contact — Get a Free Paver Quote | Marino Pavers</title>
      </Helmet>

      <PageHero
        eyebrow="Contact"
        title="Let’s talk about your yard."
        lead="Tell us what you’re picturing and we’ll come measure, bring samples, and leave you with an honest, itemized quote — free."
      />

      <section className="bg-sand">
        <div className="shell grid gap-12 py-20 lg:grid-cols-[1.3fr_1fr] lg:gap-16 lg:py-28">
          {/* Form */}
          <div className="rounded-tile border border-basalt/10 bg-bone p-7 shadow-paver sm:p-10">
            {sent ? (
              <div className="flex flex-col items-start gap-4 py-8">
                <span className="flex h-14 w-14 items-center justify-center rounded-tile bg-cherokee text-bone">
                  <Check className="h-7 w-7" strokeWidth={2.4} />
                </span>
                <h2 className="text-2xl">Your email’s ready to send.</h2>
                <p className="max-w-md leading-relaxed text-basalt/70">
                  We’ve opened your mail app with the details filled in — hit
                  send and we’ll get back to you within one business day. If
                  nothing opened, reach us directly:
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <a
                    href={site.phoneHref}
                    className="flex items-center gap-2 font-display text-lg font-800 text-basalt hover:text-cherokee"
                  >
                    <Phone className="h-4 w-4 text-cherokee" />
                    {site.phoneDisplay}
                  </a>
                  <a
                    href={site.emailHref}
                    className="flex items-center gap-2 text-basalt hover:text-cherokee"
                  >
                    <Mail className="h-4 w-4 text-cherokee" />
                    {site.email}
                  </a>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-5"
              >
                <label htmlFor="name" className="block">
                  <span className={labelClass}>Name</span>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={update('name')}
                    className={cn(fieldClass, errors.name && 'border-cherokee')}
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-sm text-cherokee">
                      {errors.name}
                    </p>
                  )}
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label htmlFor="phone" className="block">
                    <span className={labelClass}>Phone</span>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      className={fieldClass}
                      placeholder="(602) 555-0148"
                    />
                  </label>
                  <label htmlFor="email" className="block">
                    <span className={labelClass}>Email</span>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      className={fieldClass}
                      placeholder="you@email.com"
                    />
                  </label>
                </div>
                {errors.contact && (
                  <p className="-mt-2 text-sm text-cherokee">
                    {errors.contact}
                  </p>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <label htmlFor="city" className="block">
                    <span className={labelClass}>City</span>
                    <input
                      id="city"
                      type="text"
                      value={form.city}
                      onChange={update('city')}
                      className={fieldClass}
                      placeholder="Scottsdale"
                    />
                  </label>
                  <label htmlFor="budget" className="block">
                    <span className={labelClass}>Budget range</span>
                    <select
                      id="budget"
                      value={form.budget}
                      onChange={update('budget')}
                      className={fieldClass}
                    >
                      <option value="">Select one</option>
                      {budgetOptions.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label htmlFor="project" className="block">
                  <span className={labelClass}>Project type</span>
                  <select
                    id="project"
                    value={form.project}
                    onChange={update('project')}
                    className={fieldClass}
                  >
                    <option value="">What are you planning?</option>
                    {projectOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>

                <label htmlFor="details" className="block">
                  <span className={labelClass}>Project details</span>
                  <textarea
                    id="details"
                    rows={4}
                    value={form.details}
                    onChange={update('details')}
                    className={cn(
                      fieldClass,
                      'resize-y',
                      errors.details && 'border-cherokee'
                    )}
                    placeholder="Rough size, what you’re replacing, timing, anything you’ve got in mind…"
                  />
                  {errors.details && (
                    <p className="mt-1.5 text-sm text-cherokee">
                      {errors.details}
                    </p>
                  )}
                </label>

                <Button type="submit" size="lg" className="mt-2 w-full">
                  Send my quote request
                </Button>
                <p className="text-center text-xs text-basalt/45">
                  No spam, no reselling your info. We’ll only use it to quote
                  your project.
                </p>
              </form>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl">Reach us directly</h2>
              <ul className="flex flex-col gap-4 text-basalt/80">
                <li>
                  <a
                    href={site.phoneHref}
                    className="flex items-center gap-4 hover:text-cherokee"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-tile bg-basalt text-bone">
                      <Phone className="h-5 w-5" />
                    </span>
                    <span className="font-display text-lg font-800">
                      {site.phoneDisplay}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={site.emailHref}
                    className="flex items-center gap-4 hover:text-cherokee"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-tile bg-basalt text-bone">
                      <Mail className="h-5 w-5" />
                    </span>
                    {site.email}
                  </a>
                </li>
                <li className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-tile bg-basalt text-bone">
                    <MapPin className="h-5 w-5" />
                  </span>
                  {site.address.region}
                </li>
                <li className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-tile bg-basalt text-bone">
                    <Clock className="h-5 w-5" />
                  </span>
                  {site.hours}
                </li>
              </ul>
            </div>

            <div className="rounded-tile border border-basalt/10 bg-sand-light p-7">
              <h3 className="eyebrow text-cherokee">What happens next</h3>
              <ol className="mt-4 flex flex-col gap-4">
                {[
                  'We call or email within one business day.',
                  'We schedule a free on-site walkthrough with samples.',
                  'You get a clear, itemized quote — no pressure.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-basalt/75">
                    <span className="font-mono font-700 text-cherokee">
                      0{i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <p className="font-mono text-xs text-basalt/50">
              Licensed · Bonded · Insured — {site.license}
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
