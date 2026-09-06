import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export const inputClasses =
  "w-full rounded-tile border border-basalt/15 bg-sand-light px-3.5 py-2.5 text-basalt placeholder:text-basalt/35 focus:border-cherokee focus:ring-2 focus:ring-cherokee/25 focus:outline-none disabled:opacity-60";

type Props = Omit<ComponentPropsWithoutRef<"input">, "className"> & {
  className?: string;
  invalid?: boolean;
};

export const Input = ({ className, invalid, ...rest }: Props) => (
  <input
    className={cn(inputClasses, invalid && "border-cherokee", className)}
    aria-invalid={invalid || undefined}
    {...rest}
  />
);
