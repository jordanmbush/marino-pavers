import {
  Award,
  Car,
  ClipboardList,
  Flame,
  Footprints,
  Hammer,
  Handshake,
  HardHat,
  LayoutGrid,
  Layers,
  PencilRuler,
  ShieldCheck,
  Sprout,
  Users,
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
  "hard-hat": HardHat,
  users: Users,
  handshake: Handshake,
  award: Award,
} satisfies Record<IconName, LucideIcon>;
