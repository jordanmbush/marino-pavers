import { UploadCloud } from "lucide-react";
import type { ChangeEvent } from "react";
import { cn } from "./cn";

type Props = {
  id: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
  children?: string;
};

/** A drop-zone styled file picker. The native input stays for keyboard and screen readers. */
export const FileInput = ({
  id,
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  className,
  children = "Choose photos",
}: Props) => {
  const handle = (event: ChangeEvent<HTMLInputElement>) => {
    onFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-tile border-2 border-dashed border-taupe-900/20 bg-taupe-50 px-6 py-10 text-center text-sm text-taupe-900/70 transition-colors focus-within:border-taupe-700 hover:border-taupe-700 hover:text-taupe-900",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <UploadCloud className="h-7 w-7 text-taupe-700" strokeWidth={1.8} />
      <span className="font-display font-medium text-taupe-900">
        {children}
      </span>
      <span className="text-xs text-taupe-900/50">
        JPEG, PNG or WebP · up to 25 MB each
      </span>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handle}
        className="sr-only"
      />
    </label>
  );
};
