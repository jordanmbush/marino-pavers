/**
 * Single source of truth for business facts (NAP), trust signals, and nav.
 * Swap the placeholder phone / license / social for the real ones at launch.
 */

export const site = {
  name: 'Marino Pavers',
  tagline: 'Phoenix hardscape & outdoor living',
  foundedYear: 2009,
  phoneDisplay: '(602) 555-0148',
  phoneHref: 'tel:+16025550148',
  email: 'hello@marinopavers.com',
  emailHref: 'mailto:hello@marinopavers.com',
  license: 'AZ ROC #327845',
  address: {
    region: 'Greater Phoenix, Arizona',
    hq: 'Scottsdale, AZ',
  },
  hours: 'Mon–Fri 7am–5pm · Sat by appointment',
  social: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },
} as const;

export const stats = [
  { value: 'Est. 2009', label: 'Building the Valley' },
  { value: '600+', label: 'Projects installed' },
  { value: '4.9★', label: '180+ homeowner reviews' },
  { value: '2-yr', label: 'Workmanship warranty' },
] as const;

export const serviceAreas = [
  'Phoenix',
  'Scottsdale',
  'Paradise Valley',
  'Tempe',
  'Mesa',
  'Chandler',
  'Gilbert',
  'Queen Creek',
  'Glendale',
  'Peoria',
  'Cave Creek',
  'Fountain Hills',
  'Ahwatukee',
  'Surprise',
] as const;

export const nav = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Our Work', to: '/gallery' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
] as const;
