import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiFailure, createAdminClient, fetchManifestItems } from "./media";

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

afterEach(() => {
  vi.unstubAllGlobals();
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
