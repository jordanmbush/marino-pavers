import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

type Props = Omit<ComponentPropsWithoutRef<"input">, "type" | "className"> & {
  label: string;
  className?: string;
};

export const Checkbox = ({ label, className, id, ...rest }: Props) => (
  <label
    htmlFor={id}
    className={cn(
      "flex cursor-pointer items-center gap-2 text-sm text-taupe-900/80",
      className,
    )}
  >
    <input
      id={id}
      type="checkbox"
      className="h-4 w-4 accent-taupe-700"
      {...rest}
    />
    {label}
  </label>
);
