/**
 * Single source of truth for business facts (name, address, phone), trust
 * signals and navigation.
 *
 * ⚠️ PLACEHOLDERS: the phone number, email, license number, social links,
 * founding year and every stat below are stand-ins. Replace them with the
 * client's real details before launch — they appear in the footer, the
 * contact page and the LocalBusiness structured data.
 */

export const site = {
  name: "Marino Pavers",
  legalName: "Marino Pavers LLC",
  url: "https://marinopavers.com",
  tagline: "Phoenix hardscape & outdoor living",
  description:
    "Marino Pavers designs and installs custom paver patios, driveways, pool decks, artificial turf, and outdoor living spaces across greater Phoenix — engineered from the base up for the Arizona desert.",
  foundedYear: 2009,
  phoneDisplay: "(602) 555-0148",
  phoneHref: "tel:+16025550148",
  email: "hello@marinopavers.com",
  emailHref: "mailto:hello@marinopavers.com",
  license: "AZ ROC #327845",
  address: {
    region: "Greater Phoenix, Arizona",
    hq: "Scottsdale, AZ",
    locality: "Scottsdale",
    state: "AZ",
    country: "US",
  },
  hours: "Mon–Fri 7am–5pm · Sat by appointment",
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
  },
} as const;

export const stats = [
  { value: "Est. 2009", label: "Building the Valley" },
  { value: "600+", label: "Projects installed" },
  { value: "4.9★", label: "180+ homeowner reviews" },
  { value: "2-yr", label: "Workmanship warranty" },
] as const;

export const serviceAreas = [
  "Phoenix",
  "Scottsdale",
  "Paradise Valley",
  "Tempe",
  "Mesa",
  "Chandler",
  "Gilbert",
  "Queen Creek",
  "Glendale",
  "Peoria",
  "Cave Creek",
  "Fountain Hills",
  "Ahwatukee",
  "Surprise",
] as const;

export const nav = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Our Work", href: "/our-work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const credentials = [
  { icon: "award", label: "ICPI-certified installers" },
  {
    icon: "shield-check",
    label: `Licensed, bonded & insured — ${site.license}`,
  },
  { icon: "handshake", label: "2-year workmanship warranty" },
] as const;
