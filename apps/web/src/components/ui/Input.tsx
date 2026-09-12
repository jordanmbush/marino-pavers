import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export const inputClasses =
  "w-full rounded-tile border border-taupe-900/15 bg-taupe-50 px-3.5 py-2.5 text-taupe-900 placeholder:text-taupe-900/35 focus:border-taupe-700 focus:ring-2 focus:ring-taupe-700/25 focus:outline-none disabled:opacity-60";

type Props = Omit<ComponentPropsWithoutRef<"input">, "className"> & {
  className?: string;
  invalid?: boolean;
};

export const Input = ({ className, invalid, ...rest }: Props) => (
  <input
    className={cn(inputClasses, invalid && "border-taupe-700", className)}
    aria-invalid={invalid || undefined}
    {...rest}
  />
);
