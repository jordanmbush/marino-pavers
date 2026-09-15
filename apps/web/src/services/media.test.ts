import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiFailure,
  createAdminClient,
  fetchManifestItems,
  videoListJsonLd,
} from "./media";

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const readyItem = {
  id: "0123456789abcdef",
  status: "ready",
  title: "Patio",
  category: "patios",
  city: "",
  detail: "",
  featured: false,
  rotation: 0,
  order: 0,
  original: {
    key: "originals/0123456789abcdef.jpg",
    contentType: "image/jpeg",
    bytes: 1,
  },
  image: { width: 10, height: 10, widths: [10], placeholder: "data:," },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("fetchManifestItems", () => {
  it("returns ready items from a valid manifest", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        respond(200, {
          version: 1,
          generatedAt: "2026-01-01T00:00:00.000Z",
          items: [
            readyItem,
            {
              ...readyItem,
              id: "fedcba9876543210",
              status: "pending",
              image: undefined,
            },
          ],
        }),
      ),
    );
    const items = await fetchManifestItems();
    expect(items?.map((i) => i.id)).toEqual(["0123456789abcdef"]);
  });

  it("is null when there is no manifest yet or it is malformed", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respond(404, {})));
    expect(await fetchManifestItems()).toBeNull();
    vi.stubGlobal("fetch", () => Promise.resolve(respond(200, { nope: true })));
    expect(await fetchManifestItems()).toBeNull();
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    expect(await fetchManifestItems()).toBeNull();
  });
});

describe("createAdminClient", () => {
  it("sends the bearer token and parses the response", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve(respond(200, { items: [readyItem] }));
    });
    const client = createAdminClient(async () => "tok");
    const items = await client.listItems();
    expect(items).toHaveLength(1);
    expect(calls[0]?.url).toBe("/api/admin/items");
    expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe(
      "Bearer tok",
    );
  });

  it("refuses without a token", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const client = createAdminClient(async () => null);
    await expect(client.listItems()).rejects.toBeInstanceOf(ApiFailure);
  });

  it("maps an API error body to its code", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        respond(404, { error: "not_found", message: "No such photo." }),
      ),
    );
    const client = createAdminClient(async () => "tok");
    const failure = await client
      .deleteItem("0123456789abcdef")
      .catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(ApiFailure);
    expect((failure as ApiFailure).code).toBe("not_found");
    expect((failure as ApiFailure).message).toBe("No such photo.");
  });
});

describe("videoListJsonLd", () => {
  const video = {
    ...readyItem,
    id: "abcdef0123456789",
    kind: "video" as const,
    original: {
      key: "originals/abcdef0123456789.mp4",
      contentType: "video/mp4" as const,
      bytes: 1,
    },
    video: {
      width: 1920,
      height: 1080,
      heights: [480, 1080],
      durationSeconds: 72,
    },
  };
  const photo = { ...readyItem, kind: "photo" as const };
  const name = () => "Casa Ortega";
  const absolute = (url: string) =>
    new URL(url, "https://marinopavers.com").href;

  const build = (items: unknown[]) =>
    videoListJsonLd(
      items as Parameters<typeof videoListJsonLd>[0],
      name,
      absolute,
    );

  it("describes each prerendered video, and nothing else", () => {
    vi.stubEnv("PUBLIC_MEDIA_URL", "https://cdn.test/media");
    const data = build([photo, video]) as {
      itemListElement: Array<{ item: Record<string, string> }>;
    };
    expect(data.itemListElement).toHaveLength(1);
    const item = data.itemListElement[0]!.item;
    expect(item["@type"]).toBe("VideoObject");
    expect(item.contentUrl).toBe(
      "https://cdn.test/media/renditions/abcdef0123456789/r0/v1080.mp4",
    );
    expect(item.thumbnailUrl).toBe(
      "https://cdn.test/media/renditions/abcdef0123456789/r0/10.webp",
    );
    expect(item.uploadDate).toBe("2026-01-01T00:00:00.000Z");
  });

  it("writes the duration the way schema.org reads it", () => {
    vi.stubEnv("PUBLIC_MEDIA_URL", "https://cdn.test/media");
    const of = (seconds: number) =>
      (
        build([
          { ...video, video: { ...video.video, durationSeconds: seconds } },
        ]) as {
          itemListElement: Array<{ item: { duration: string } }>;
        }
      ).itemListElement[0]!.item.duration;
    expect(of(72)).toBe("PT1M12S");
    expect(of(12)).toBe("PT12S");
    expect(of(60)).toBe("PT1M");
  });

  it("claims nothing when there are no videos", () => {
    vi.stubEnv("PUBLIC_MEDIA_URL", "https://cdn.test/media");
    expect(build([photo])).toBeNull();
  });

  it("claims nothing when the build has no absolute media URL", () => {
    // A build with no stage prerenders no items, so there is nothing to name.
    expect(build([video])).toBeNull();
  });
});
