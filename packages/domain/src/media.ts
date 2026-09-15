import { z } from "zod";

/**
 * The photo library, as data.
 *
 * A `MediaItem` is one uploaded photo or video and everything the site needs
 * to show it. It is written twice: once by the admin API when an upload is
 * requested (`status: "pending"`, no `image`), and once by whichever
 * processor finishes it (`status: "ready"`, `image` filled in). The public
 * manifest carries ready items only — see `buildManifest`.
 *
 * A video is a photo that also moves: the transcoder captures a frame and
 * runs it through the very same sharp pipeline, so `image` means the same
 * thing for both kinds and every poster, srcset, blur placeholder and admin
 * thumbnail works on a video without knowing it is one. `video` is the extra
 * part — the MP4 renditions and what they contain.
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

/**
 * What was uploaded. Absent from records written before videos existed, so
 * the schema defaults it to "photo" — an old item parses unchanged.
 */
export const MEDIA_KINDS = ["photo", "video"] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export const mediaKindSchema = z.enum(MEDIA_KINDS);

/** Rendition widths, ascending. The largest is also the cap: nothing is ever upscaled past it. */
export const RENDITION_WIDTHS = [480, 960, 1440, 2048] as const;

/** Width of the inline blur placeholder written into the item. */
export const PLACEHOLDER_WIDTH = 24;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Video is allowed to be far bigger than a photo because the browser sends
 * the camera's file untouched and the transcoder shrinks it afterwards. At
 * the rate a phone records 4K this is roughly four minutes of clip, which is
 * longer than anything the gallery wants to show.
 */
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

/**
 * What the admin page may upload, and the extension each is stored under.
 * HEIC is deliberately absent: the prebuilt sharp binaries can't decode it,
 * and iOS converts to JPEG on upload when the input asks for these types.
 */
export const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

/**
 * QuickTime is here because that is what an iPhone hands over, and its
 * contents are usually HEVC, which Android will not play. Nothing uploaded
 * is ever served as-is — MediaConvert re-encodes every video to H.264 — so
 * accepting the container costs nothing and refusing it would turn away the
 * one device the client actually films on.
 */
export const ACCEPTED_VIDEO_TYPES = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
} as const;

/** Every type the upload route accepts, whichever kind it turns into. */
export const ACCEPTED_UPLOAD_TYPES = {
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
} as const;

export type AcceptedImageType = keyof typeof ACCEPTED_IMAGE_TYPES;
export type AcceptedVideoType = keyof typeof ACCEPTED_VIDEO_TYPES;
export type AcceptedUploadType = keyof typeof ACCEPTED_UPLOAD_TYPES;

const typesOf = <T extends string>(types: Record<T, string>) =>
  Object.keys(types) as [T, ...T[]];

export const acceptedImageTypeSchema = z.enum(typesOf(ACCEPTED_IMAGE_TYPES));
export const acceptedVideoTypeSchema = z.enum(typesOf(ACCEPTED_VIDEO_TYPES));
export const acceptedUploadTypeSchema = z.enum(typesOf(ACCEPTED_UPLOAD_TYPES));

export const isVideoType = (type: string): type is AcceptedVideoType =>
  type in ACCEPTED_VIDEO_TYPES;

/** Which pipeline a content type belongs to: sharp, or MediaConvert. */
export const kindForUploadType = (type: AcceptedUploadType): MediaKind =>
  isVideoType(type) ? "video" : "photo";

/** The upload limit for a kind, in bytes. */
export const maxBytesFor = (kind: MediaKind): number =>
  kind === "video" ? MAX_VIDEO_BYTES : MAX_UPLOAD_BYTES;

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
 * Heights the transcoder is asked for. Two, not four, because `<video>` has
 * no `srcset`: the page picks a file by where it is putting it, so the only
 * useful renditions are "small enough to autoplay in a grid tile" and "good
 * enough to fill the lightbox".
 */
export const VIDEO_RENDITION_HEIGHTS = [480, 1080] as const;

/** Which rendition each surface asks for, by height. */
export const VIDEO_SIZES = {
  /** The grid tile, where every card is playing at once. */
  grid: 480,
  /** The lightbox, where one video has the screen. */
  lightbox: 1080,
} as const;

export const mediaVideoSchema = z.object({
  /** The largest rendition's pixel size, after rotation. */
  width: z.int().positive(),
  height: z.int().positive(),
  /**
   * Heights of the renditions that exist, ascending. Taken from what the
   * transcoder reports it actually wrote, not from what it was asked for.
   */
  heights: z.array(z.int().positive()).min(1),
  durationSeconds: z.number().positive(),
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
  /**
   * `failed` exists for video: a transcode can come back rejected hours
   * after the upload succeeded, and a client staring at "Processing…"
   * forever learns nothing. The manifest carries ready items only, so a
   * failure is visible in the admin and invisible on the site.
   */
  status: z.enum(["pending", "ready", "failed"]),
  kind: mediaKindSchema.default("photo"),
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
  /** The poster, for a video: the captured frame, rendered like any photo. */
  image: mediaImageSchema.optional(),
  /** Only on a video, and only once the transcode landed. */
  video: mediaVideoSchema.optional(),
  /** The transcoder's job id, kept so a late completion can be matched back. */
  jobId: z.string().optional(),
  /** Why the last attempt failed, shown in the admin. */
  error: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;
export type MediaImage = z.infer<typeof mediaImageSchema>;
export type MediaVideo = z.infer<typeof mediaVideoSchema>;

export type ReadyMediaItem = MediaItem & {
  status: "ready";
  image: MediaImage;
};

export type ReadyVideoItem = ReadyMediaItem & {
  kind: "video";
  video: MediaVideo;
};

/**
 * Ready means "the site can render this now". For a video that takes both
 * halves — the poster the grid paints immediately and the MP4 it plays —
 * so a half-finished transcode can never reach the manifest.
 */
export const isReady = (item: MediaItem): item is ReadyMediaItem =>
  item.status === "ready" &&
  item.image !== undefined &&
  (item.kind !== "video" || item.video !== undefined);

export const isVideo = (item: ReadyMediaItem): item is ReadyVideoItem =>
  item.kind === "video" && item.video !== undefined;

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
