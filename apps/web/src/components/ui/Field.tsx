import type { ReactNode } from "react";
import { cn } from "./cn";

type Props = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error, the only field wrapper the admin uses. */
export const Field = ({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: Props) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <label htmlFor={htmlFor} className="text-base text-taupe-600">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-sm text-taupe-700" role="alert">
        {error}
      </p>
    ) : (
      hint && <p className="text-xs text-taupe-900/50">{hint}</p>
    )}
  </div>
);
