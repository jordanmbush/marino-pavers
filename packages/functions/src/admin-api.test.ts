import {
  MANIFEST_KEY,
  itemKey,
  originalKey,
  renditionKey,
  type MediaItem,
} from "@marino/domain";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { describe, expect, it } from "vitest";
import { createAdminApiHandler } from "./admin-api";
import { readItem, writeItem } from "./lib/items";
import { silentLogger } from "./lib/logger";
import { createMemoryStore } from "./lib/memory-store";

const ID_A = "aaaaaaaaaaaaaaaa";
const ID_B = "bbbbbbbbbbbbbbbb";
const NOW = new Date("2026-09-06T12:00:00Z");
const ORIGIN = "https://dev.marinopavers.com";

type Req = {
  method: string;
  path: string;
  body?: unknown;
  token?: string | null;
  origin?: string;
  base64?: boolean;
};

const request = ({
  method,
  path,
  body,
  token = "good",
  origin,
  base64,
}: Req): APIGatewayProxyEventV2 => {
  const raw = body === undefined ? undefined : JSON.stringify(body);
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: path,
    rawQueryString: "",
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(origin ? { origin } : {}),
    },
    requestContext: {
      accountId: "1",
      apiId: "a",
      domainName: "x.lambda-url.us-west-1.on.aws",
      domainPrefix: "x",
      http: {
        method,
        path,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "test",
      },
      requestId: "r",
      routeKey: "$default",
      stage: "$default",
      time: "now",
      timeEpoch: 0,
    },
    body: raw && base64 ? Buffer.from(raw, "utf8").toString("base64") : raw,
    isBase64Encoded: Boolean(raw && base64),
  };
};

const verifyToken = async (token: string) => {
  if (token !== "good") throw new Error("bad token");
  return { sub: "user-1", email: "owner@example.com" };
};

const ready = (id: string, overrides: Partial<MediaItem> = {}): MediaItem => ({
  id,
  status: "ready",
  title: id,
  category: "patios",
  city: "",
  detail: "",
  featured: false,
  order: 0,
  rotation: 0,
  original: {
    key: originalKey(id, "jpg"),
    contentType: "image/jpeg",
    bytes: 3,
  },
  image: { width: 10, height: 10, widths: [10], placeholder: "data:," },
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
  ...overrides,
});

const setup = () => {
  const store = createMemoryStore();
  const handler = createAdminApiHandler({
    store,
    verifyToken,
    now: () => NOW,
    presignExpiresSeconds: 300,
    allowedOrigins: [ORIGIN],
    logger: silentLogger,
  });
  return { store, handler };
};

const parse = (body: string | undefined) => JSON.parse(body ?? "null");

describe("auth", () => {
  it("rejects a missing or bad token", async () => {
    const { handler } = setup();
    const missing = await handler(
      request({ method: "GET", path: "/api/admin/items", token: null }),
    );
    expect(missing.statusCode).toBe(401);
    expect(parse(missing.body).error).toBe("unauthorized");
    const bad = await handler(
      request({ method: "GET", path: "/api/admin/items", token: "nope" }),
    );
    expect(bad.statusCode).toBe(401);
  });

  it("answers preflight without a token", async () => {
    const { handler } = setup();
    const result = await handler(
      request({
        method: "OPTIONS",
        path: "/api/admin/items",
        token: null,
        origin: ORIGIN,
      }),
    );
    expect(result.statusCode).toBe(204);
    expect(result.headers?.["access-control-allow-origin"]).toBe(ORIGIN);
  });
});

describe("cors", () => {
  it("sends CORS headers only for an allowed origin", async () => {
    const { handler } = setup();
    const allowed = await handler(
      request({ method: "GET", path: "/api/admin/items", origin: ORIGIN }),
    );
    expect(allowed.headers?.["access-control-allow-origin"]).toBe(ORIGIN);
    expect(allowed.headers?.vary).toBe("origin");
    const other = await handler(
      request({
        method: "GET",
        path: "/api/admin/items",
        origin: "https://evil.example",
      }),
    );
    expect(other.headers?.["access-control-allow-origin"]).toBeUndefined();
    const same = await handler(
      request({ method: "GET", path: "/api/admin/items" }),
    );
    expect(same.headers?.["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("uploads", () => {
  it("creates a pending item and a presigned URL", async () => {
    const { store, handler } = setup();
    const result = await handler(
      request({
        method: "POST",
        path: "/api/admin/uploads",
        body: {
          filename: "desert-ridge-patio.jpg",
          contentType: "image/jpeg",
          bytes: 1234,
          category: "patios",
          city: "Phoenix",
        },
      }),
    );
    expect(result.statusCode).toBe(201);
    const { item, uploadUrl, headers } = parse(result.body);
    expect(item.status).toBe("pending");
    expect(item.title).toBe("Desert ridge patio");
    expect(item.city).toBe("Phoenix");
    expect(item.original).toEqual({
      key: `originals/${item.id}.jpg`,
      contentType: "image/jpeg",
      bytes: 1234,
    });
    expect(uploadUrl).toContain(`originals/${item.id}.jpg`);
    expect(uploadUrl).toContain("X-Amz-Expires=300");
    expect(headers).toEqual({ "Content-Type": "image/jpeg" });
    expect(await readItem(store, item.id, silentLogger)).toEqual(item);
    expect(store.objects.has(MANIFEST_KEY)).toBe(false);
  });

  it("accepts a base64-encoded body", async () => {
    const { handler } = setup();
    const result = await handler(
      request({
        method: "POST",
        path: "/api/admin/uploads",
        base64: true,
        body: {
          filename: "a.png",
          contentType: "image/png",
          bytes: 10,
          category: "turf",
        },
      }),
    );
    expect(result.statusCode).toBe(201);
  });

  it("rejects a bad body with the reason", async () => {
    const { handler } = setup();
    const result = await handler(
      request({
        method: "POST",
        path: "/api/admin/uploads",
        body: {
          filename: "a.gif",
          contentType: "image/gif",
          bytes: 10,
          category: "turf",
        },
      }),
    );
    expect(result.statusCode).toBe(400);
    expect(parse(result.body)).toMatchObject({ error: "bad_request" });
    expect(parse(result.body).message).toContain("contentType");

    const empty = await handler(
      request({ method: "POST", path: "/api/admin/uploads" }),
    );
    expect(empty.statusCode).toBe(400);
  });
});

describe("items", () => {
  it("lists in display order, pending included", async () => {
    const { store, handler } = setup();
    await writeItem(store, ready(ID_A, { order: 2 }));
    await writeItem(
      store,
      ready(ID_B, { order: 1, status: "pending", image: undefined }),
    );
    const result = await handler(
      request({ method: "GET", path: "/api/admin/items" }),
    );
    expect(result.statusCode).toBe(200);
    expect(parse(result.body).items.map((i: MediaItem) => i.id)).toEqual([
      ID_B,
      ID_A,
    ]);
  });

  it("updates one item and republishes", async () => {
    const { store, handler } = setup();
    await writeItem(store, ready(ID_A));
    const result = await handler(
      request({
        method: "PATCH",
        path: `/api/admin/items/${ID_A}`,
        body: { title: "New title", featured: true },
      }),
    );
    expect(result.statusCode).toBe(200);
    const { item } = parse(result.body);
    expect(item).toMatchObject({
      title: "New title",
      featured: true,
      city: "",
      updatedAt: NOW.toISOString(),
    });
    const manifest = parse(
      store.objects.get(MANIFEST_KEY)?.body.toString("utf8"),
    );
    expect(manifest.items[0].title).toBe("New title");
  });

  it("leaves the fields a patch doesn't mention alone", async () => {
    const { store, handler } = setup();
    await writeItem(
      store,
      ready(ID_A, {
        title: "Keep me",
        featured: true,
        order: 3,
        rotation: 180,
      }),
    );
    const result = await handler(
      request({
        method: "PATCH",
        path: `/api/admin/items/${ID_A}`,
        body: { city: "Mesa" },
      }),
    );
    expect(result.statusCode).toBe(200);
    expect(parse(result.body).item).toMatchObject({
      title: "Keep me",
      featured: true,
      order: 3,
      rotation: 180,
      city: "Mesa",
      status: "ready",
    });
    expect(store.touched).toEqual([]);
  });

  it("does not publish a pending item when edited", async () => {
    const { store, handler } = setup();
    await writeItem(
      store,
      ready(ID_A, { status: "pending", image: undefined }),
    );
    const result = await handler(
      request({
        method: "PATCH",
        path: `/api/admin/items/${ID_A}`,
        body: { title: "x" },
      }),
    );
    expect(result.statusCode).toBe(200);
    expect(store.objects.has(MANIFEST_KEY)).toBe(false);
  });

  it("sends a rotated photo back through the processor", async () => {
    const { store, handler } = setup();
    await writeItem(store, ready(ID_A));
    await store.putObject(
      originalKey(ID_A, "jpg"),
      Buffer.from("o"),
      "image/jpeg",
    );
    const result = await handler(
      request({
        method: "PATCH",
        path: `/api/admin/items/${ID_A}`,
        body: { rotation: 90, title: "Turned" },
      }),
    );
    expect(result.statusCode).toBe(200);
    const { item } = parse(result.body);
    expect(item).toMatchObject({
      status: "pending",
      rotation: 90,
      title: "Turned",
    });
    expect(item.image).toBeUndefined();
    expect(await readItem(store, ID_A, silentLogger)).toEqual(item);
    expect(store.touched).toEqual([originalKey(ID_A, "jpg")]);
    // The manifest keeps naming the old renditions until the new ones exist.
    expect(store.objects.has(MANIFEST_KEY)).toBe(false);
  });

  it("leaves the renditions alone when the rotation is unchanged", async () => {
    const { store, handler } = setup();
    await writeItem(store, ready(ID_A, { rotation: 180 }));
    const result = await handler(
      request({
        method: "PATCH",
        path: `/api/admin/items/${ID_A}`,
        body: { rotation: 180 },
      }),
    );
    expect(result.statusCode).toBe(200);
    expect(parse(result.body).item.status).toBe("ready");
    expect(store.touched).toEqual([]);
    expect(store.objects.has(MANIFEST_KEY)).toBe(true);
  });

  it("records a rotation for a photo still being processed", async () => {
    const { store, handler } = setup();
    await writeItem(
      store,
      ready(ID_A, { status: "pending", image: undefined }),
    );
    const result = await handler(
      request({
        method: "PATCH",
        path: `/api/admin/items/${ID_A}`,
        body: { rotation: 270 },
      }),
    );
    expect(result.statusCode).toBe(200);
    expect((await readItem(store, ID_A, silentLogger))?.rotation).toBe(270);
    expect(store.touched).toEqual([]);
  });

  it("rejects a rotation that is not a quarter turn", async () => {
    const { store, handler } = setup();
    await writeItem(store, ready(ID_A));
    const result = await handler(
      request({
        method: "PATCH",
        path: `/api/admin/items/${ID_A}`,
        body: { rotation: 45 },
      }),
    );
    expect(result.statusCode).toBe(400);
    expect(parse(result.body).message).toContain("rotation");
  });

  it("reorders in bulk", async () => {
    const { store, handler } = setup();
    await writeItem(store, ready(ID_A, { order: 1 }));
    await writeItem(store, ready(ID_B, { order: 2 }));
    const result = await handler(
      request({
        method: "PATCH",
        path: "/api/admin/items",
        body: {
          orders: [
            { id: ID_A, order: 2 },
            { id: ID_B, order: 1 },
            { id: "cccccccccccccccc", order: 3 },
          ],
        },
      }),
    );
    expect(result.statusCode).toBe(200);
    expect(parse(result.body)).toEqual({ ok: true });
    const manifest = parse(
      store.objects.get(MANIFEST_KEY)?.body.toString("utf8"),
    );
    expect(manifest.items.map((i: MediaItem) => i.id)).toEqual([ID_B, ID_A]);
  });

  it("deletes an item with everything derived from it", async () => {
    const { store, handler } = setup();
    await writeItem(store, ready(ID_A));
    await writeItem(store, ready(ID_B));
    await store.putObject(
      originalKey(ID_A, "jpg"),
      Buffer.from("o"),
      "image/jpeg",
    );
    await store.putObject(
      renditionKey(ID_A, 0, 10),
      Buffer.from("r"),
      "image/webp",
    );
    const result = await handler(
      request({ method: "DELETE", path: `/api/admin/items/${ID_A}` }),
    );
    expect(result.statusCode).toBe(200);
    expect(store.objects.has(itemKey(ID_A))).toBe(false);
    expect(store.objects.has(originalKey(ID_A, "jpg"))).toBe(false);
    expect(store.objects.has(renditionKey(ID_A, 0, 10))).toBe(false);
    const manifest = parse(
      store.objects.get(MANIFEST_KEY)?.body.toString("utf8"),
    );
    expect(manifest.items.map((i: MediaItem) => i.id)).toEqual([ID_B]);
  });

  it("404s an unknown id and a malformed one", async () => {
    const { handler } = setup();
    const unknown = await handler(
      request({ method: "DELETE", path: `/api/admin/items/${ID_A}` }),
    );
    expect(unknown.statusCode).toBe(404);
    const malformed = await handler(
      request({ method: "PATCH", path: "/api/admin/items/nope", body: {} }),
    );
    expect(malformed.statusCode).toBe(404);
  });
});

describe("manifest and routing", () => {
  it("rebuilds on demand", async () => {
    const { store, handler } = setup();
    await writeItem(store, ready(ID_A));
    const result = await handler(
      request({ method: "POST", path: "/api/admin/manifest" }),
    );
    expect(result.statusCode).toBe(200);
    const manifest = parse(
      store.objects.get(MANIFEST_KEY)?.body.toString("utf8"),
    );
    expect(manifest.generatedAt).toBe(NOW.toISOString());
  });

  it("405s the wrong method and 404s unknown paths", async () => {
    const { handler } = setup();
    expect(
      (await handler(request({ method: "DELETE", path: "/api/admin/uploads" })))
        .statusCode,
    ).toBe(405);
    expect(
      (await handler(request({ method: "GET", path: "/api/admin/manifest/" })))
        .statusCode,
    ).toBe(405);
    expect(
      (await handler(request({ method: "GET", path: "/api/other" })))
        .statusCode,
    ).toBe(404);
  });

  it("hides internal failures behind a 500", async () => {
    const store = createMemoryStore();
    store.listKeys = async () => {
      throw new Error("boom");
    };
    const handler = createAdminApiHandler({
      store,
      verifyToken,
      logger: silentLogger,
    });
    const result = await handler(
      request({ method: "GET", path: "/api/admin/items" }),
    );
    expect(result.statusCode).toBe(500);
    expect(parse(result.body)).toMatchObject({ error: "internal" });
  });
});
