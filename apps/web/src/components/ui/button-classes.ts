import { cn } from "./cn";

/**
 * One class recipe shared by the Astro and React buttons so a link on a
 * static page and a button inside an island look identical. Labels are set
 * in the site's one typeface, sentence case, like everything else.
 */

export type ButtonVariant =
  "primary" | "solid" | "outline" | "ghost" | "onDark" | "bare";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-tile text-[1.0625rem] leading-none font-medium transition-colors duration-200 focus-visible:outline-taupe-700 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  // The card's ink, solid: the primary action
  primary: "bg-taupe-950 text-paper hover:bg-taupe-800",
  // The mark's dark grey
  solid: "bg-taupe-700 text-paper hover:bg-taupe-800",
  // A hairline box
  outline:
    "border border-taupe-300 bg-transparent text-taupe-950 hover:border-taupe-700",
  // An underlined word
  ghost:
    "text-taupe-700 underline decoration-taupe-300 hover:text-taupe-950 hover:decoration-taupe-700",
  // Hairline box on the lightbox's dark backdrop
  onDark:
    "border border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10",
  // No chrome at all: for a card or icon button that styles itself.
  bare: "",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-base",
  md: "px-6 py-3",
  lg: "px-7 py-3.5 text-[1.1875rem]",
};

export type ButtonStyle = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  class?: string;
};

export const buttonClasses = ({
  variant = "primary",
  size = "md",
  class: className,
}: ButtonStyle = {}): string =>
  variant === "bare"
    ? cn("cursor-pointer focus-visible:outline-taupe-700", className)
    : cn(base, variants[variant], sizes[size], className);
