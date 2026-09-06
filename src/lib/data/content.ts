/* eslint-disable sonarjs/no-duplicate-string -- repeated category/tag labels read clearer inline */
import {
  Car,
  ClipboardList,
  Flame,
  Footprints,
  Hammer,
  Layers,
  LayoutGrid,
  PencilRuler,
  ShieldCheck,
  Sprout,
  Waves,
  type LucideIcon,
} from 'lucide-react';

export type Service = {
  slug: string;
  icon: LucideIcon;
  title: string;
  tagline: string;
  description: string;
  features: string[];
};

export const services: Service[] = [
  {
    slug: 'paver-patios',
    icon: LayoutGrid,
    title: 'Paver Patios',
    tagline: 'The outdoor room you actually use',
    description:
      'A patio sized and shaped for how you live outside — morning coffee, Friday dinners, the whole family at the holidays. Laid on an engineered base so it stays flat and true for decades.',
    features: [
      'Travertine, concrete & clay pavers',
      'Herringbone, ashlar & running-bond patterns',
      'Built-in seat walls & planters',
      'Drainage graded away from the house',
    ],
  },
  {
    slug: 'driveways',
    icon: Car,
    title: 'Paver Driveways',
    tagline: 'Curb appeal that carries the load',
    description:
      'A driveway is the first thing anyone sees — and the hardest-working surface on your property. Herringbone-laid pavers interlock to spread the weight of daily traffic without cracking like a concrete slab.',
    features: [
      'Herringbone lay for maximum interlock',
      'Reinforced base rated for vehicle loads',
      'Individual pavers replaceable if stained',
      'Crisp banding & border details',
    ],
  },
  {
    slug: 'artificial-turf',
    icon: Sprout,
    title: 'Artificial Turf',
    tagline: 'Green year-round, zero water bills',
    description:
      'A lawn that stays green through a Phoenix August with no mowing, no overseeding, and no water. Pet- and kid-friendly turf on a draining base that handles monsoon downpours.',
    features: [
      'Pet-rated with odor-control infill',
      'Free-draining base for monsoon season',
      'Cool-tech yarns for lower surface heat',
      'Putting greens & play areas',
    ],
  },
  {
    slug: 'pool-decks',
    icon: Waves,
    title: 'Pool Decks & Coping',
    tagline: 'Cool underfoot, safe when wet',
    description:
      'Travertine and shell-stone pavers stay cooler than concrete and give a natural grip wet or dry — the right surface for bare feet around a Valley pool. Coping and deck laid as one clean field.',
    features: [
      'Cool-to-touch travertine & shell stone',
      'Slip-resistant when wet',
      'Bullnose coping to match',
      'Re-decks over old concrete',
    ],
  },
  {
    slug: 'walkways',
    icon: Footprints,
    title: 'Walkways & Steps',
    tagline: 'The path that ties it together',
    description:
      'Front-entry approaches, side-yard runs, and garden paths that guide the eye and hold up to daily use. Steps and landings built to code with solid, even risers.',
    features: [
      'Front entries & garden paths',
      'Code-compliant steps & landings',
      'Landscape lighting integration',
      'Matched banding to your patio or drive',
    ],
  },
  {
    slug: 'outdoor-living',
    icon: Flame,
    title: 'Outdoor Living',
    tagline: 'Kitchens, fire & shade',
    description:
      'The features that turn a backyard into a destination: built-in BBQ islands, fire pits and fireplaces, ramadas and pergolas for shade, and retaining walls that make a slope usable.',
    features: [
      'BBQ islands & outdoor kitchens',
      'Fire pits, fireplaces & fire tables',
      'Ramadas, pergolas & shade structures',
      'Retaining, seat & privacy walls',
    ],
  },
];

export type ProcessStep = {
  n: string;
  icon: LucideIcon;
  title: string;
  body: string;
};

export const process: ProcessStep[] = [
  {
    n: '01',
    icon: ClipboardList,
    title: 'Free consult & quote',
    body: 'We walk your space, take measurements, bring material samples, and hand you an itemized bid — no pressure, no vague ballparks.',
  },
  {
    n: '02',
    icon: PencilRuler,
    title: 'Design & materials',
    body: 'Together we settle the layout, pattern, paver line, and colors, so you can picture the finished space before a shovel touches dirt.',
  },
  {
    n: '03',
    icon: Layers,
    title: 'Site prep & base',
    body: 'The part cheap installers rush. We excavate, grade for drainage, and compact the aggregate base in lifts — the foundation everything rides on.',
  },
  {
    n: '04',
    icon: Hammer,
    title: 'Precision install',
    body: 'We lay your pattern, make clean cuts on the borders, compact the field, lock the joints with polymeric sand, and clean up as we go.',
  },
  {
    n: '05',
    icon: ShieldCheck,
    title: 'Walkthrough & warranty',
    body: 'We walk the finished job with you, leave the site cleaner than we found it, and back the work with a two-year workmanship warranty.',
  },
];

export type Project = {
  title: string;
  city: string;
  category: string;
  detail: string;
  /** gradient stops for the placeholder tile until real photos drop in */
  from: string;
  to: string;
};

export const projectCategories = [
  'All',
  'Patios',
  'Driveways',
  'Pool Decks',
  'Turf',
  'Outdoor Living',
] as const;

export const projects: Project[] = [
  {
    title: 'Desert Ridge patio',
    city: 'Phoenix',
    category: 'Patios',
    detail: 'Travertine · French pattern',
    from: '#CBB58A',
    to: '#9C8158',
  },
  {
    title: 'McCormick Ranch drive',
    city: 'Scottsdale',
    category: 'Driveways',
    detail: 'Charcoal pavers · Herringbone',
    from: '#4E4336',
    to: '#211C17',
  },
  {
    title: 'Ahwatukee pool deck',
    city: 'Ahwatukee',
    category: 'Pool Decks',
    detail: 'Shell-stone · Bullnose coping',
    from: '#EDE3D2',
    to: '#C7AB7C',
  },
  {
    title: 'Gilbert backyard turf',
    city: 'Gilbert',
    category: 'Turf',
    detail: 'Pet turf · 2,400 sq ft',
    from: '#71755B',
    to: '#585B45',
  },
  {
    title: 'Paradise Valley ramada',
    city: 'Paradise Valley',
    category: 'Outdoor Living',
    detail: 'Cedar ramada · BBQ island',
    from: '#CD854A',
    to: '#8E3421',
  },
  {
    title: 'Tempe courtyard',
    city: 'Tempe',
    category: 'Patios',
    detail: 'Clay pavers · Running bond',
    from: '#C0563D',
    to: '#8E3421',
  },
  {
    title: 'Chandler entry walk',
    city: 'Chandler',
    category: 'Patios',
    detail: 'Sandstone · Banded border',
    from: '#D0B98C',
    to: '#A98B5E',
  },
  {
    title: 'Cave Creek fire court',
    city: 'Cave Creek',
    category: 'Outdoor Living',
    detail: 'Fire pit · Seat walls',
    from: '#A8432B',
    to: '#3B3228',
  },
  {
    title: 'Mesa circular drive',
    city: 'Mesa',
    category: 'Driveways',
    detail: 'Tan pavers · Soldier course',
    from: '#BB9A64',
    to: '#7A6244',
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  city: string;
  project: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      'Three summers of monsoons later and the patio still sits perfectly flat — not one paver has shifted. You can tell the base work was done right.',
    name: 'Dana & Rob P.',
    city: 'Scottsdale',
    project: 'Travertine patio',
  },
  {
    quote:
      'They ripped out a cracked concrete driveway and laid herringbone pavers that make the whole house look new. The crew was on time every single day.',
    name: 'Marcus L.',
    city: 'Chandler',
    project: 'Paver driveway',
  },
  {
    quote:
      'Ditched the grass we could never keep alive for turf and a fire pit. Our water bill dropped, and the backyard finally gets used. Wish we’d done it sooner.',
    name: 'Priya S.',
    city: 'Gilbert',
    project: 'Turf & fire pit',
  },
];

export type Faq = {
  q: string;
  a: string;
};

export const faqs: Faq[] = [
  {
    q: 'How much does a paver project cost?',
    a: 'Most residential paver projects in the Valley run between $14 and $28 per square foot installed, depending on the paver line, pattern complexity, demo, and site conditions. We give you an itemized quote after seeing the space — never a vague number over the phone.',
  },
  {
    q: 'How long does an installation take?',
    a: 'A typical patio or driveway takes three to seven working days from demo to cleanup. Larger outdoor-living builds run longer. We give you a firm schedule with the quote and keep you posted at every stage.',
  },
  {
    q: 'Why pavers instead of poured concrete?',
    a: 'A concrete slab is a single sheet that cracks as the ground moves. Interlocking pavers flex with it, spread loads, and any single paver can be lifted and reset if it stains or settles — no ugly patch. They also stay cooler and look far better.',
  },
  {
    q: 'Does artificial turf get too hot in Phoenix?',
    a: 'Turf runs warmer than a living lawn in direct sun, but modern cool-tech yarns and lighter infills cut surface temps significantly, and it cools fast in shade or with a quick rinse. For full-sun play areas we’ll talk through the best product and layout.',
  },
  {
    q: 'Do you handle HOA approvals and permits?',
    a: 'Yes. We build to code, pull permits where they’re required, and we’ll prepare the drawings and material specs your HOA needs for architectural review. It’s part of the job, not an upcharge surprise.',
  },
  {
    q: 'Are you licensed and insured?',
    a: 'Fully. We’re licensed, bonded, and insured in Arizona (ROC #327845), and every installation is backed by a two-year workmanship warranty on top of the manufacturer’s paver warranty.',
  },
];
