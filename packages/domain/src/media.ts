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

/** Quarter turns clockwise, applied after the EXIF orientation when renditions are made. */
export const ROTATIONS = [0, 90, 180, 270] as const;

export type Rotation = (typeof ROTATIONS)[number];

export const rotationSchema = z.union([
  z.literal(0),
  z.literal(90),
  z.literal(180),
  z.literal(270),
]);

/** One quarter turn from `rotation`: clockwise for 1, anticlockwise for -1. */
export const turn = (rotation: Rotation, delta: -1 | 1): Rotation =>
  ROTATIONS[(ROTATIONS.indexOf(rotation) + delta + 4) % 4]!;

export const mediaIdSchema = z.string().regex(MEDIA_ID_PATTERN);

export const mediaImageSchema = z.object({
  width: z.int().positive(),
  height: z.int().positive(),
  /** Widths of the renditions that exist, ascending. */
  widths: z.array(z.int().positive()).min(1),
  /** A tiny WebP as a data URI, shown while the real image loads. */
  placeholder: z.string(),
});

/**
 * The fields the admin page may change, without defaults. The stored record
 * adds them below; a partial update must not — an absent field there means
 * "leave it alone", and a default would quietly write "" or false over what
 * is stored.
 */
const editableFields = {
  title: z.string().max(120),
  category: mediaCategorySchema,
  city: z.string().max(60),
  /** A short material/pattern note, e.g. "Travertine · French pattern". */
  detail: z.string().max(120),
  /** Featured items surface on the home page. */
  featured: z.boolean(),
  /** Manual sort position, ascending. Ties fall back to newest first. */
  order: z.int(),
  /**
   * How the client wants the photo turned, on top of what the camera's EXIF
   * tag already says. Changing it re-renders every rendition, and the
   * renditions live under a per-rotation prefix so the old ones can't be
   * served from a long-lived cache.
   */
  rotation: rotationSchema,
};

export const mediaItemSchema = z.object({
  id: mediaIdSchema,
  status: z.enum(["pending", "ready"]),
  title: editableFields.title.default(""),
  category: editableFields.category,
  city: editableFields.city.default(""),
  detail: editableFields.detail.default(""),
  featured: editableFields.featured.default(false),
  order: editableFields.order.default(0),
  rotation: editableFields.rotation.default(0),
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

/** What one update may carry: any of the editable fields, only those given. */
export const editableItemSchema = z.object(editableFields).partial();

export type EditableItem = z.infer<typeof editableItemSchema>;

/** The fields a row edits, held as a draft until saved. */
export type ItemDraft = Required<Omit<EditableItem, "order">>;

export const draftOf = (item: MediaItem): ItemDraft => ({
  title: item.title,
  category: item.category,
  city: item.city,
  detail: item.detail,
  featured: item.featured,
  rotation: item.rotation,
});

/** Where a draft differs from the stored item — empty when nothing changed. */
export const editablePatch = (
  item: MediaItem,
  draft: ItemDraft,
): EditableItem => {
  const patch: EditableItem = {};
  if (draft.title !== item.title) patch.title = draft.title;
  if (draft.category !== item.category) patch.category = draft.category;
  if (draft.city !== item.city) patch.city = draft.city;
  if (draft.detail !== item.detail) patch.detail = draft.detail;
  if (draft.featured !== item.featured) patch.featured = draft.featured;
  if (draft.rotation !== item.rotation) patch.rotation = draft.rotation;
  return patch;
};
