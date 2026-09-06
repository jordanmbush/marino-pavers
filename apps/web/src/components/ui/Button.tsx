import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { buttonClasses, type ButtonStyle } from "./button-classes";

type ButtonProps = Omit<ButtonStyle, "class"> & {
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

/** The island button. `type` defaults to "button" so a stray click can't submit a form. */
export const Button = ({
  variant,
  size,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={buttonClasses({ variant, size, class: className })}
    {...rest}
  >
    {children}
  </button>
);
