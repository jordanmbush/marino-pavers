import {
  ADMIN_API,
  createUploadRequestSchema,
  extensionFor,
  isReady,
  newMediaId,
  originalKey,
  reorderRequestSchema,
  sortItems,
  titleFromFilename,
  updateItemRequestSchema,
  type CreateUploadResponse,
  type MediaItem,
} from "@marino/domain";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { createCognitoVerifier, type VerifyToken } from "./lib/auth";
import {
  bearerToken,
  corsHeaders,
  error,
  json,
  noContent,
  parseJsonBody,
  requestOrigin,
  type Headers,
} from "./lib/http";
import {
  deleteItemAndDerived,
  listItems,
  readItem,
  rebuildManifest,
  writeItem,
} from "./lib/items";
import { consoleLogger, type Logger } from "./lib/logger";
import { createS3Store, type ObjectStore } from "./lib/s3";

export type AdminApiDeps = {
  store: ObjectStore;
  verifyToken: VerifyToken;
  now?: () => Date;
  presignExpiresSeconds?: number;
  allowedOrigins?: readonly string[];
  logger?: Logger;
};

type Result = APIGatewayProxyStructuredResultV2;

type Ctx = Required<AdminApiDeps> & { cors: Headers };

const ITEM_PATH = /^\/api\/admin\/items\/([a-f0-9]{16})$/;

type Issues = { issues: Array<{ path: PropertyKey[]; message: string }> };

const issueSummary = (err: Issues): string =>
  err.issues
    .map(
      (issue) =>
        `${issue.path.map(String).join(".") || "body"}: ${issue.message}`,
    )
    .join("; ");

const withoutUndefined = <T extends object>(value: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as Partial<T>;

const createUpload = async (
  event: APIGatewayProxyEventV2,
  ctx: Ctx,
): Promise<Result> => {
  const body = parseJsonBody(event);
  if (!body.ok) return error(400, "bad_request", body.message, ctx.cors);
  const parsed = createUploadRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return error(400, "bad_request", issueSummary(parsed.error), ctx.cors);
  }
  const request = parsed.data;

  const id = newMediaId();
  const key = originalKey(id, extensionFor(request.contentType));
  const at = ctx.now().toISOString();
  const item: MediaItem = {
    id,
    status: "pending",
    title: request.title || titleFromFilename(request.filename),
    category: request.category,
    city: request.city,
    detail: request.detail,
    featured: false,
    order: 0,
    original: {
      key,
      contentType: request.contentType,
      bytes: request.bytes,
    },
    createdAt: at,
    updatedAt: at,
  };
  await writeItem(ctx.store, item);

  const uploadUrl = await ctx.store.presignPut(
    key,
    request.contentType,
    ctx.presignExpiresSeconds,
  );
  const response: CreateUploadResponse = {
    item,
    uploadUrl,
    headers: { "Content-Type": request.contentType },
  };
  return json(201, response, ctx.cors);
};

const list = async (ctx: Ctx): Promise<Result> =>
  json(
    200,
    { items: sortItems(await listItems(ctx.store, ctx.logger)) },
    ctx.cors,
  );

const reorder = async (
  event: APIGatewayProxyEventV2,
  ctx: Ctx,
): Promise<Result> => {
  const body = parseJsonBody(event);
  if (!body.ok) return error(400, "bad_request", body.message, ctx.cors);
  const parsed = reorderRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return error(400, "bad_request", issueSummary(parsed.error), ctx.cors);
  }
  const at = ctx.now().toISOString();
  for (const { id, order } of parsed.data.orders) {
    const item = await readItem(ctx.store, id, ctx.logger);
    if (item) await writeItem(ctx.store, { ...item, order, updatedAt: at });
  }
  await rebuildManifest(ctx.store, ctx.now(), ctx.logger);
  return json(200, { ok: true }, ctx.cors);
};

const update = async (
  event: APIGatewayProxyEventV2,
  id: string,
  ctx: Ctx,
): Promise<Result> => {
  const body = parseJsonBody(event);
  if (!body.ok) return error(400, "bad_request", body.message, ctx.cors);
  const parsed = updateItemRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return error(400, "bad_request", issueSummary(parsed.error), ctx.cors);
  }
  const existing = await readItem(ctx.store, id, ctx.logger);
  if (!existing) return error(404, "not_found", "No such photo.", ctx.cors);

  const item: MediaItem = {
    ...existing,
    ...withoutUndefined(parsed.data),
    updatedAt: ctx.now().toISOString(),
  };
  await writeItem(ctx.store, item);
  if (isReady(item)) await rebuildManifest(ctx.store, ctx.now(), ctx.logger);
  return json(200, { item }, ctx.cors);
};

const remove = async (id: string, ctx: Ctx): Promise<Result> => {
  const existing = await readItem(ctx.store, id, ctx.logger);
  if (!existing) return error(404, "not_found", "No such photo.", ctx.cors);
  await deleteItemAndDerived(ctx.store, id);
  await rebuildManifest(ctx.store, ctx.now(), ctx.logger);
  return json(200, { ok: true }, ctx.cors);
};

const rebuild = async (ctx: Ctx): Promise<Result> => {
  await rebuildManifest(ctx.store, ctx.now(), ctx.logger);
  return json(200, { ok: true }, ctx.cors);
};

const route = async (
  method: string,
  path: string,
  event: APIGatewayProxyEventV2,
  ctx: Ctx,
): Promise<Result> => {
  const notAllowed = () =>
    error(
      405,
      "method_not_allowed",
      `${method} is not allowed here.`,
      ctx.cors,
    );

  if (path === ADMIN_API.uploads) {
    return method === "POST" ? createUpload(event, ctx) : notAllowed();
  }
  if (path === ADMIN_API.items) {
    if (method === "GET") return list(ctx);
    if (method === "PATCH") return reorder(event, ctx);
    return notAllowed();
  }
  const item = ITEM_PATH.exec(path);
  if (item) {
    const id = item[1]!;
    if (method === "PATCH") return update(event, id, ctx);
    if (method === "DELETE") return remove(id, ctx);
    return notAllowed();
  }
  if (path === ADMIN_API.manifest) {
    return method === "POST" ? rebuild(ctx) : notAllowed();
  }
  return Promise.resolve(error(404, "not_found", "No such route.", ctx.cors));
};

export const createAdminApiHandler = ({
  store,
  verifyToken,
  now = () => new Date(),
  presignExpiresSeconds = 15 * 60,
  allowedOrigins = [],
  logger = consoleLogger,
}: AdminApiDeps) => {
  return async (event: APIGatewayProxyEventV2): Promise<Result> => {
    const cors = corsHeaders(requestOrigin(event), allowedOrigins);
    const method = event.requestContext.http.method.toUpperCase();
    const path = event.rawPath.replace(/\/+$/, "") || "/";

    if (method === "OPTIONS") return noContent(cors);

    const ctx: Ctx = {
      store,
      verifyToken,
      now,
      presignExpiresSeconds,
      allowedOrigins,
      logger,
      cors,
    };

    try {
      const token = bearerToken(event);
      if (!token) {
        return error(401, "unauthorized", "Sign in to manage photos.", cors);
      }
      try {
        await verifyToken(token);
      } catch (cause) {
        logger.warn("rejected token", { error: cause });
        return error(
          401,
          "unauthorized",
          "Your session has expired. Sign in again.",
          cors,
        );
      }
      return await route(method, path, event, ctx);
    } catch (cause) {
      logger.error("admin api failed", { method, path, error: cause });
      return error(500, "internal", "Something went wrong. Try again.", cors);
    }
  };
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
};

const originsFromEnv = (): string[] =>
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin !== "");

let wired: ReturnType<typeof createAdminApiHandler> | undefined;

export const handler = (event: APIGatewayProxyEventV2): Promise<Result> => {
  wired ??= createAdminApiHandler({
    store: createS3Store(requireEnv("MEDIA_BUCKET")),
    verifyToken: createCognitoVerifier({
      userPoolId: requireEnv("COGNITO_USER_POOL_ID"),
      clientId: requireEnv("COGNITO_CLIENT_ID"),
    }),
    allowedOrigins: originsFromEnv(),
  });
  return wired(event);
};
