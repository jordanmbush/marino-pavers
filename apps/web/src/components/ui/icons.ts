import {
  Car,
  ClipboardList,
  Flame,
  Footprints,
  Hammer,
  LayoutGrid,
  Layers,
  PencilRuler,
  ShieldCheck,
  Sprout,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/content/icons";

/** Every icon name content may use, mapped to its glyph. Missing one is a compile error. */
export const ICONS = {
  "layout-grid": LayoutGrid,
  car: Car,
  sprout: Sprout,
  waves: Waves,
  footprints: Footprints,
  flame: Flame,
  "clipboard-list": ClipboardList,
  "pencil-ruler": PencilRuler,
  layers: Layers,
  hammer: Hammer,
  "shield-check": ShieldCheck,
} satisfies Record<IconName, LucideIcon>;
