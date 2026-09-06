import { z } from "zod";

/**
 * The photo library, as data.
 *
 * A `MediaItem` is one uploaded photo and everything the site needs to show
 * it. It is written twice: once by the admin API when an upload is requested
 * (`status: "pending"`, no `image`), and once by the image processor after
 * the renditions exist (`status: "ready"`, `image` filled in). The public
 * manifest carries ready items only — see `buildManifest`.
 */

export const MEDIA_CATEGORIES = [
  { slug: "patios", label: "Patios" },
  { slug: "driveways", label: "Driveways" },
  { slug: "pool-decks", label: "Pool Decks" },
  { slug: "turf", label: "Turf" },
  { slug: "walkways", label: "Walkways" },
  { slug: "outdoor-living", label: "Outdoor Living" },
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number]["slug"];

const categorySlugs = MEDIA_CATEGORIES.map((c) => c.slug) as [
  MediaCategory,
  ...MediaCategory[],
];

export const mediaCategorySchema = z.enum(categorySlugs);

export const categoryLabel = (slug: MediaCategory): string =>
  MEDIA_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

/** Rendition widths, ascending. The largest is also the cap: nothing is ever upscaled past it. */
export const RENDITION_WIDTHS = [480, 960, 1440, 2048] as const;

/** Width of the inline blur placeholder written into the item. */
export const PLACEHOLDER_WIDTH = 24;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * What the admin page may upload, and the extension each is stored under.
 * HEIC is deliberately absent: the prebuilt sharp binaries can't decode it,
 * and iOS converts to JPEG on upload when the input asks for these types.
 */
export const ACCEPTED_UPLOAD_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AcceptedUploadType = keyof typeof ACCEPTED_UPLOAD_TYPES;

const acceptedTypes = Object.keys(ACCEPTED_UPLOAD_TYPES) as [
  AcceptedUploadType,
  ...AcceptedUploadType[],
];

export const acceptedUploadTypeSchema = z.enum(acceptedTypes);

export const MEDIA_ID_PATTERN = /^[a-f0-9]{16}$/;

export const mediaIdSchema = z.string().regex(MEDIA_ID_PATTERN);

export const mediaImageSchema = z.object({
  width: z.int().positive(),
  height: z.int().positive(),
  /** Widths of the renditions that exist, ascending. */
  widths: z.array(z.int().positive()).min(1),
  /** A tiny WebP as a data URI, shown while the real image loads. */
  placeholder: z.string(),
});

export const mediaItemSchema = z.object({
  id: mediaIdSchema,
  status: z.enum(["pending", "ready"]),
  title: z.string().max(120).default(""),
  category: mediaCategorySchema,
  city: z.string().max(60).default(""),
  /** A short material/pattern note, e.g. "Travertine · French pattern". */
  detail: z.string().max(120).default(""),
  /** Featured items surface on the home page. */
  featured: z.boolean().default(false),
  /** Manual sort position, ascending. Ties fall back to newest first. */
  order: z.int().default(0),
  original: z.object({
    key: z.string().min(1),
    contentType: acceptedUploadTypeSchema,
    bytes: z.int().nonnegative(),
  }),
  image: mediaImageSchema.optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;
export type MediaImage = z.infer<typeof mediaImageSchema>;

export type ReadyMediaItem = MediaItem & {
  status: "ready";
  image: MediaImage;
};

export const isReady = (item: MediaItem): item is ReadyMediaItem =>
  item.status === "ready" && item.image !== undefined;

export const MANIFEST_VERSION = 1;

export const manifestSchema = z.object({
  version: z.literal(MANIFEST_VERSION),
  generatedAt: z.iso.datetime(),
  items: z.array(mediaItemSchema),
});

export type Manifest = z.infer<typeof manifestSchema>;

/** The fields the admin page may edit after upload. */
export const editableItemSchema = mediaItemSchema
  .pick({
    title: true,
    category: true,
    city: true,
    detail: true,
    featured: true,
    order: true,
  })
  .partial();

export type EditableItem = z.infer<typeof editableItemSchema>;
