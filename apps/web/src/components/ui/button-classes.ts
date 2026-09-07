import { cn } from "./cn";

/**
 * One class recipe shared by the Astro and React buttons so a link on a
 * static page and a button inside an island look identical.
 */

export type ButtonVariant =
  "primary" | "solid" | "outline" | "ghost" | "onDark" | "bare";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-tile font-mono text-[0.82rem] font-bold uppercase tracking-[0.14em] transition-all duration-200 focus-visible:outline-cherokee disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  // Cherokee-red clay: the primary action
  primary:
    "bg-cherokee text-bone shadow-paver hover:-translate-y-0.5 hover:bg-cherokee-dark active:translate-y-0",
  // Basalt block
  solid:
    "bg-basalt text-bone hover:-translate-y-0.5 hover:bg-basalt-800 active:translate-y-0",
  // Set-in-stone outline
  outline:
    "border border-basalt/25 bg-transparent text-basalt hover:border-basalt/60 hover:bg-basalt/5",
  ghost: "text-basalt/70 hover:text-basalt",
  // Outline for use on basalt sections
  onDark:
    "border border-bone/30 bg-transparent text-bone hover:border-bone hover:bg-bone/10",
  // No chrome at all: for a card or icon button that styles itself.
  bare: "",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[0.72rem]",
  md: "px-6 py-3",
  lg: "px-8 py-4 text-[0.86rem]",
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
    ? cn("cursor-pointer focus-visible:outline-cherokee", className)
    : cn(base, variants[variant], sizes[size], className);
