import { useState } from "react";
import {
  ACCEPTED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  MEDIA_CATEGORIES,
  acceptedUploadTypeSchema,
  type MediaCategory,
} from "@marino/domain";
import { Field } from "@/components/ui/Field";
import { FileInput } from "@/components/ui/FileInput";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/components/ui/cn";
import { uploadFile, type AdminClient } from "@/services/media";

type Props = { client: AdminClient; onUploaded: () => void };

type Row = {
  name: string;
  progress: number;
  state: "uploading" | "done" | "failed";
  note?: string;
};

const CATEGORY_OPTIONS = MEDIA_CATEGORIES.map((c) => ({
  value: c.slug,
  label: c.label,
}));

/**
 * Pick photos, tag them, send them. Each file gets its own presigned URL
 * and goes straight to S3; the processor takes it from there, and the list
 * below polls until the thumbnail shows.
 */
export const UploadPanel = ({ client, onUploaded }: Props) => {
  const [category, setCategory] = useState<MediaCategory>("patios");
  const [city, setCity] = useState("");
  const [detail, setDetail] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const busy = rows.some((row) => row.state === "uploading");

  const setRow = (index: number, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const send = async (files: File[]) => {
    const start = rows.length;
    setRows((current) => [
      ...current,
      ...files.map((file) => ({
        name: file.name,
        progress: 0,
        state: "uploading" as const,
      })),
    ]);

    await Promise.all(
      files.map(async (file, i) => {
        const index = start + i;
        const type = acceptedUploadTypeSchema.safeParse(file.type);
        if (!type.success) {
          setRow(index, { state: "failed", note: "Only JPEG, PNG or WebP." });
          return;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          setRow(index, { state: "failed", note: "Over 25 MB." });
          return;
        }
        try {
          const { uploadUrl, headers } = await client.createUpload({
            filename: file.name,
            contentType: type.data,
            bytes: file.size,
            category,
            city,
            detail,
          });
          await uploadFile(uploadUrl, headers, file, (fraction) =>
            setRow(index, { progress: fraction }),
          );
          setRow(index, { state: "done", progress: 1 });
        } catch (cause) {
          setRow(index, {
            state: "failed",
            note: cause instanceof Error ? cause.message : "Upload failed.",
          });
        }
      }),
    );
    onUploaded();
  };

  return (
    <section className="shadow-paver flex flex-col gap-5 rounded-tile border border-taupe-900/10 bg-white p-6 sm:p-8">
      <div>
        <span className="eyebrow text-taupe-700">Add photos</span>
        <h2 className="mt-2 text-xl">Upload from a job</h2>
        <p className="mt-1 text-sm text-taupe-900/60">
          Set the category and location first — they apply to every photo in
          this batch and can be changed later.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category" htmlFor="upload-category">
          <Select
            id="upload-category"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value as MediaCategory)}
          />
        </Field>
        <Field label="City" htmlFor="upload-city">
          <Input
            id="upload-city"
            placeholder="Scottsdale"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>
        <Field
          label="Detail"
          htmlFor="upload-detail"
          hint="Material or pattern, e.g. Travertine · French pattern"
        >
          <Input
            id="upload-detail"
            placeholder="Travertine · French pattern"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </Field>
      </div>

      <FileInput
        id="upload-files"
        accept={Object.keys(ACCEPTED_UPLOAD_TYPES).join(",")}
        multiple
        disabled={busy}
        onFiles={(files) => void send(files)}
      >
        {busy ? "Uploading…" : "Choose photos"}
      </FileInput>

      {rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <li
              key={`${row.name}-${i}`}
              className="flex flex-col gap-1 text-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="truncate font-mono text-xs">{row.name}</span>
                <span
                  className={cn(
                    "shrink-0 eyebrow",
                    row.state === "done" && "text-taupe-500",
                    row.state === "failed" && "text-taupe-700",
                  )}
                >
                  {row.state === "uploading"
                    ? `${Math.round(row.progress * 100)}%`
                    : row.state === "done"
                      ? "Uploaded — processing"
                      : (row.note ?? "Failed")}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-taupe-900/10">
                <div
                  className={cn(
                    "h-full transition-[width]",
                    row.state === "failed" ? "bg-taupe-700" : "bg-taupe-500",
                  )}
                  style={{ width: `${Math.round(row.progress * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
