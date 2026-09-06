import {
  ADMIN_API,
  apiErrorSchema,
  createUploadResponseSchema,
  itemResponseSchema,
  listItemsResponseSchema,
  manifestSchema,
  okResponseSchema,
  readyItems,
  type ApiError,
  type CreateUploadRequest,
  type CreateUploadResponse,
  type EditableItem,
  type MediaItem,
  type ReadyMediaItem,
} from "@marino/domain";

/**
 * Everything the site knows about where photos live. Views get items and
 * URLs from here; nothing else in the app touches the media host or the
 * admin API.
 */

const trimSlash = (url: string) => url.replace(/\/$/, "");

/** Root of renditions and manifest.json. Root-relative unless the env points elsewhere. */
export const mediaBase = (): string =>
  trimSlash(import.meta.env.PUBLIC_MEDIA_URL || "/media");

/** Root of the admin API. Empty string means the same origin as the page. */
export const apiBase = (): string =>
  trimSlash(import.meta.env.PUBLIC_API_URL || "");

const manifestUrl = () => `${mediaBase()}/manifest.json`;

/** The live photo library, or null when there isn't one yet or it can't be reached. */
export const fetchManifestItems = async (): Promise<
  ReadyMediaItem[] | null
> => {
  try {
    const response = await fetch(manifestUrl(), { cache: "no-cache" });
    if (!response.ok) return null;
    const parsed = manifestSchema.safeParse(await response.json());
    return parsed.success ? readyItems(parsed.data.items) : null;
  } catch {
    return null;
  }
};

/**
 * What a page can pre-render at build. Needs an absolute URL, so a build with
 * no env (or a root-relative one) renders the empty state and the island
 * fills in at runtime.
 */
export const prefetchManifestItems = async (): Promise<ReadyMediaItem[]> => {
  if (!/^https?:\/\//.test(mediaBase())) return [];
  return (await fetchManifestItems()) ?? [];
};

export class ApiFailure extends Error {
  constructor(
    public readonly code: ApiError["error"],
    message: string,
  ) {
    super(message);
    this.name = "ApiFailure";
  }
}

type Parser<T> = { parse(input: unknown): T };

/** The admin API, bound to whatever supplies the Cognito id token. */
export const createAdminClient = (getToken: () => Promise<string | null>) => {
  const request = async <T>(
    parser: Parser<T>,
    path: string,
    init: RequestInit = {},
  ): Promise<T> => {
    const token = await getToken();
    if (!token)
      throw new ApiFailure("unauthorized", "Sign in to manage photos.");
    const response = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsed = apiErrorSchema.safeParse(body);
      throw new ApiFailure(
        parsed.success ? parsed.data.error : "internal",
        parsed.success
          ? parsed.data.message
          : `Request failed (${response.status}).`,
      );
    }
    return parser.parse(body);
  };

  return {
    listItems: async (): Promise<MediaItem[]> =>
      (await request(listItemsResponseSchema, ADMIN_API.items)).items,
    createUpload: (body: CreateUploadRequest): Promise<CreateUploadResponse> =>
      request(createUploadResponseSchema, ADMIN_API.uploads, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateItem: async (id: string, patch: EditableItem): Promise<MediaItem> =>
      (
        await request(itemResponseSchema, ADMIN_API.item(id), {
          method: "PATCH",
          body: JSON.stringify(patch),
        })
      ).item,
    reorder: (orders: Array<{ id: string; order: number }>) =>
      request(okResponseSchema, ADMIN_API.items, {
        method: "PATCH",
        body: JSON.stringify({ orders }),
      }),
    deleteItem: (id: string) =>
      request(okResponseSchema, ADMIN_API.item(id), { method: "DELETE" }),
    rebuildManifest: () =>
      request(okResponseSchema, ADMIN_API.manifest, { method: "POST" }),
  };
};

export type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * PUT the file straight to S3 on the presigned URL. XMLHttpRequest rather
 * than fetch because only it reports upload progress.
 */
export const uploadFile = (
  uploadUrl: string,
  headers: Record<string, string>,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    for (const [name, value] of Object.entries(headers))
      xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress)
        onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}).`));
    xhr.onerror = () =>
      reject(new Error("Upload failed — check your connection."));
    xhr.send(file);
  });
