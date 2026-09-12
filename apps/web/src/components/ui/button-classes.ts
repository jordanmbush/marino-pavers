import { cn } from "./cn";

/**
 * One class recipe shared by the Astro and React buttons so a link on a
 * static page and a button inside an island look identical. Labels are the
 * small capitals of the `label` utility; the colours are the card's greys.
 */

export type ButtonVariant =
  "primary" | "solid" | "outline" | "ghost" | "onDark" | "bare";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-tile label transition-colors duration-200 focus-visible:outline-taupe-700 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  // The card's ink, solid: the primary action
  primary: "bg-taupe-900 text-paper hover:bg-taupe-950",
  // The mark's dark grey
  solid: "bg-taupe-700 text-paper hover:bg-taupe-800",
  // A hairline box
  outline:
    "border border-taupe-300 bg-transparent text-taupe-900 hover:border-taupe-700",
  ghost: "text-taupe-700 hover:text-taupe-900",
  // Hairline box for the dark bands
  onDark:
    "border border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10",
  // No chrome at all: for a card or icon button that styles itself.
  bare: "",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[0.68rem]",
  md: "px-6 py-3",
  lg: "px-8 py-4 text-[0.8rem]",
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
