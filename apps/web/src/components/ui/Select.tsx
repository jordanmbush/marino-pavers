import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";
import { inputClasses } from "./Input";

type Props = Omit<ComponentPropsWithoutRef<"select">, "className"> & {
  className?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
};

export const Select = ({ className, options, ...rest }: Props) => (
  <select className={cn(inputClasses, "cursor-pointer", className)} {...rest}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);
