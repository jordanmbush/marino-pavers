/**
 * Single source of truth for business facts: name, contact details, address,
 * service area and the routes in the primary nav. Anything a person reads as
 * a sentence lives in `content/copy/` instead, once per language.
 *
 * ⚠️ PLACEHOLDERS: the project count and the Scottsdale address below are
 * stand-ins until the client confirms them — they appear in the stats band
 * and the LocalBusiness structured data.
 */

export const site = {
  name: "Marino Pavers",
  legalName: "Marino Pavers, LLC",
  /** The name as the business card prints it, set beside the mark. */
  wordmark: "Marino Pavers, LLC.",
  owner: "Daniel Montoya",
  url: "https://marinopavers.com",
  /** From the business card: "20+ Years of Experience". */
  yearsExperience: "20+",
  projectsInstalled: "600+",
  phoneDisplay: "(602) 691-8029",
  phoneHref: "tel:+16026918029",
  /**
   * The inbox is receive-only: Valeria reads it and answers from her personal
   * iCloud account, so the copy beside the address tells a customer whose
   * name to look for. Add her reply address here if the client ever wants it
   * published.
   */
  email: "contact@marinopavers.com",
  address: {
    hq: "Scottsdale, AZ",
    locality: "Scottsdale",
    state: "AZ",
    country: "US",
  },
} as const;

export type SocialId = "instagram" | "facebook";

/**
 * Real profiles only. A network without a link stays out of the footer and
 * the structured data until the client supplies one — Facebook is pending.
 */
export const socials: ReadonlyArray<{ id: SocialId; href: string }> = [
  { id: "instagram", href: "https://www.instagram.com/marino.pavers/" },
];

/**
 * A mailto that opens with a body template, so the sender is prompted for a
 * phone number — the crew calls back rather than emailing when it can. The
 * subject and template are copy, so each language builds its own.
 */
export const mailto = (subject: string, body: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

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

/**
 * The primary nav's routes, unprefixed. Labels come from the copy dictionary
 * (`copy.nav[id]`) and the locale prefix is added when a link is rendered.
 */
export const nav = [
  { id: "home", href: "/" },
  { id: "services", href: "/services" },
  { id: "gallery", href: "/gallery" },
] as const;

export type NavId = (typeof nav)[number]["id"];
