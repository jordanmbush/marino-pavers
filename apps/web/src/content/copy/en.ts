import type { MediaCategory } from "@marino/domain";
import { mailto, serviceAreas, site, type NavId } from "../site";

/**
 * Every sentence on the public site, in English. This dictionary is the
 * shape: `es.ts` is typed against it, so a string added here without its
 * translation is a compile error, not a blank spot.
 *
 * Strings with `{slots}` are templates; fill them with `fill()` from
 * `@/services/locale`. Keep the dictionary plain data (no functions) — the
 * gallery slice is handed to a React island as a prop, and Astro serializes
 * island props to the page.
 */
export const en = {
  skipToContent: "Skip to content",
  /** The one-paragraph pitch: home page meta description and LocalBusiness JSON-LD. */
  description:
    "Custom paver patios, driveways, pool decks, artificial turf and outdoor living across greater Phoenix, engineered from the base up for the Arizona desert.",

  nav: {
    home: "Home",
    services: "Services",
    gallery: "Photo Gallery",
  } satisfies Record<NavId, string>,

  header: {
    primaryNav: "Primary",
    language: "Language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    logo: "Marino Pavers — home",
  },

  home: {
    title: "Marino Pavers — Phoenix Paver Patios, Driveways & Artificial Turf",
    hero: {
      eyebrow: "Pavers · Turf · Outdoor Living",
      /** Three lines; the middle one is set in italic. */
      titleStart: "Outdoor spaces",
      titleAccent: "built to outlast",
      titleEnd: "the desert.",
      lead: "Marino Pavers designs and installs custom patios, driveways, pool decks, and artificial turf across the Valley — engineered from the base up to take Arizona heat, monsoon, and time.",
      cta: "View photo gallery",
      since: `${site.yearsExperience} years of experience`,
      calloutEyebrow: "Herringbone lay",
      callout: "Driveway · Scottsdale",
    },
    /**
     * Warranty terms vary by job, so nothing here quotes a specific period —
     * the last stat counts service areas instead.
     */
    stats: [
      { value: site.yearsExperience, label: "Years of experience" },
      { value: site.projectsInstalled, label: "Projects installed" },
      { value: `${serviceAreas.length}`, label: "Valley cities served" },
    ],
    services: {
      eyebrow: "What we build",
      title: "Six ways to live better outside.",
      lead: "Every surface engineered for the desert, laid by our own crews — never subbed out to the lowest bidder.",
    },
    process: {
      eyebrow: "How it goes",
      title: "From first walkthrough to warranty.",
      lead: "Five steps, one crew, no mystery. You’ll always know what’s happening in your yard and what comes next.",
    },
    featured: {
      eyebrow: "Recent work",
      title: "Built across the Valley.",
      lead: "A few backyards, driveways, and pool decks we’ve wrapped up lately.",
      link: "View photo gallery",
    },
    testimonials: {
      eyebrow: "From the Valley",
      title: "Homeowners who stopped putting it off.",
    },
    area: {
      eyebrow: "Where we work",
      title: "Serving the Greater Phoenix Area.",
      lead: "From Cave Creek down to Queen Creek, we cover the Valley. Don’t see your city? Ask — we travel for the right project.",
    },
  },

  servicesPage: {
    title: "Services — Paver Patios, Driveways, Turf & More | Marino Pavers",
    description:
      "Paver patios, driveways, pool decks, artificial turf, walkways and outdoor living across greater Phoenix. One crew, engineered base work, warranty-backed.",
    hero: {
      eyebrow: "Services",
      title: "Everything that turns bare dirt into a destination.",
      lead: "Six specialties, one crew. Whether it’s a single walkway or a full backyard build, the base work and finish detail are the same — done right.",
    },
    seeBuilt: "See {service} we’ve built →",
    faq: {
      eyebrow: "Good questions",
      title: "Answers before you ask.",
      lead: "The things Valley homeowners want to know before they commit.",
    },
  },

  galleryPage: {
    title:
      "Photo Gallery — Paver & Turf Projects Across Phoenix | Marino Pavers",
    description:
      "Photos of paver patios, driveways, pool decks, artificial turf and outdoor living builds Marino Pavers has installed across greater Phoenix.",
    hero: {
      eyebrow: "Photo gallery",
      title: "Laid across the Valley, one yard at a time.",
      lead: "Patios, driveways, pool decks, and turf from Cave Creek to Queen Creek. Filter by what you’re planning.",
    },
    cta: {
      eyebrow: "Your yard next",
      title: "See something you want in your own backyard?",
      lead: "Send us a photo of your space and a note on what you’re after. We’ll follow up with ideas and an honest quote.",
    },
  },

  /** The photo grid island: filters, empty state, lightbox controls. */
  gallery: {
    filterLabel: "Filter projects by category",
    all: "All",
    categories: {
      patios: "Patios",
      driveways: "Driveways",
      "pool-decks": "Pool Decks",
      turf: "Turf",
      walkways: "Walkways",
      "outdoor-living": "Outdoor Living",
    } satisfies Record<MediaCategory, string>,
    empty: "Project photos are on their way.",
    showing:
      "Showing {shown} of {total} recent projects. Want to see something specific — a paver line, a pattern, a whole backyard? Ask and we’ll send photos from jobs like yours.",
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
    project: "{category} project",
    viewLarger: "View larger: {alt}",
  },

  cta: {
    eyebrow: "Get in touch",
    title: "Let’s build something you’ll actually use outside.",
    lead: "Tell us about your space and we’ll walk it with you, bring samples, and leave you with an honest, itemized quote — no pressure.",
    call: "Call now",
    preferTalk: "Prefer to talk?",
    serving: "Serving the {region}.",
    preferWrite: "Prefer to write?",
  },

  contact: {
    region: "Greater Phoenix Area",
    /** Daniel's line in the footer, as on the business card. */
    ownerTitle: "Owner",
    emailHref: mailto(
      "Project inquiry",
      "Name:\nPhone:\nCity:\n\nWhat I'm planning:\n",
    ),
    emailNotePhone: "Include your phone number so we can call you back.",
    emailNoteReplies:
      "Our office admin, Valeria, will reach out — usually the same day, though please allow one business day. Her reply comes from her personal @icloud.com address rather than this inbox, so check your spam folder if you don’t see it.",
  },

  /** The one 404 page, which carries every language; see `pages/404.astro`. */
  notFound: {
    title: "Page not found — Marino Pavers",
    description: "That page washed out.",
    eyebrow: "Error 404",
    titleStart: "This path leads",
    titleAccent: "nowhere.",
    lead: "Looks like this one washed out. Every other path on the site is on solid ground — head back and pick one.",
    back: "Back home",
    pages: "Site pages",
  },

  footer: {
    blurb:
      "Custom paver patios, driveways, pool decks, artificial turf, and outdoor living — engineered from the base up for the Arizona desert.",
    services: "Services",
    explore: "Explore",
    contact: "Get in touch",
    instagram: "Marino Pavers on Instagram",
    facebook: "Marino Pavers on Facebook",
    serving: "Serving {areas} & {last}.",
    rights: "All rights reserved.",
  },
};

export type Copy = typeof en;
