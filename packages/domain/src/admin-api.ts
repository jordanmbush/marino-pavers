import { z } from "zod";
import {
  MAX_VIDEO_BYTES,
  acceptedUploadTypeSchema,
  editableItemSchema,
  kindForUploadType,
  maxBytesFor,
  mediaCategorySchema,
  mediaIdSchema,
  mediaItemSchema,
} from "./media";

/**
 * The contract between the admin page and the admin Lambda. Both sides parse
 * with these schemas, so a shape change is a compile error on one side and a
 * 400 on the other rather than a silent mismatch.
 *
 * Every route needs `Authorization: Bearer <Cognito id token>`.
 */

export const ADMIN_API = {
  /** POST — ask for a presigned upload URL and create the pending item. */
  uploads: "/api/admin/uploads",
  /** GET — every item, pending ones included. PATCH — bulk reorder. */
  items: "/api/admin/items",
  /** PATCH — edit one item. DELETE — remove it and everything derived from it. */
  item: (id: string) => `/api/admin/items/${id}`,
  /** POST — run the processing again for an item that failed or is stuck. */
  retry: (id: string) => `/api/admin/items/${id}/retry`,
  /** POST — rebuild manifest.json from items/. */
  manifest: "/api/admin/manifest",
} as const;

/**
 * The size limit depends on what is being uploaded, so the field caps at the
 * larger of the two and a refinement holds each kind to its own. Doing it the
 * other way round — a union of two object schemas — reports "no variant
 * matched" for a mistyped city, which tells the client nothing.
 */
export const createUploadRequestSchema = z
  .object({
    filename: z.string().min(1).max(200),
    contentType: acceptedUploadTypeSchema,
    bytes: z.int().positive().max(MAX_VIDEO_BYTES),
    title: z.string().max(120).default(""),
    category: mediaCategorySchema,
    city: z.string().max(60).default(""),
    detail: z.string().max(120).default(""),
  })
  .refine(
    (request) =>
      request.bytes <= maxBytesFor(kindForUploadType(request.contentType)),
    {
      path: ["bytes"],
      message: "File is larger than the limit for its type.",
    },
  );

export type CreateUploadRequest = z.input<typeof createUploadRequestSchema>;

export const createUploadResponseSchema = z.object({
  item: mediaItemSchema,
  /** PUT the file here, with exactly these headers. */
  uploadUrl: z.url(),
  headers: z.record(z.string(), z.string()),
});

export type CreateUploadResponse = z.infer<typeof createUploadResponseSchema>;

export const listItemsResponseSchema = z.object({
  items: z.array(mediaItemSchema),
});

export type ListItemsResponse = z.infer<typeof listItemsResponseSchema>;

export const updateItemRequestSchema = editableItemSchema;

export const itemResponseSchema = z.object({ item: mediaItemSchema });

export const reorderRequestSchema = z.object({
  orders: z.array(z.object({ id: mediaIdSchema, order: z.int() })).min(1),
});

export type ReorderRequest = z.infer<typeof reorderRequestSchema>;

export const okResponseSchema = z.object({ ok: z.literal(true) });

export const apiErrorSchema = z.object({
  error: z.enum([
    "unauthorized",
    "not_found",
    "bad_request",
    "method_not_allowed",
    "internal",
  ]),
  message: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
