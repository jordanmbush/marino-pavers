import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class lists, letting the later one win on conflicts. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
