import type { ApiError } from "@marino/domain";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

export type Headers = Record<string, string>;

export const corsHeaders = (
  origin: string | undefined,
  allowed: readonly string[],
): Headers =>
  origin && allowed.includes(origin)
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "authorization,content-type",
        "access-control-max-age": "600",
        vary: "origin",
      }
    : {};

export const json = (
  status: number,
  body: unknown,
  headers: Headers = {},
): APIGatewayProxyStructuredResultV2 => ({
  statusCode: status,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
    ...headers,
  },
  body: JSON.stringify(body),
});

export const error = (
  status: number,
  code: ApiError["error"],
  message: string,
  headers: Headers = {},
): APIGatewayProxyStructuredResultV2 =>
  json(status, { error: code, message } satisfies ApiError, headers);

export const noContent = (
  headers: Headers = {},
): APIGatewayProxyStructuredResultV2 => ({ statusCode: 204, headers });

export type ParsedBody =
  { ok: true; value: unknown } | { ok: false; message: string };

export const parseJsonBody = (event: APIGatewayProxyEventV2): ParsedBody => {
  if (!event.body) return { ok: false, message: "Request body is empty." };
  const text = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, message: "Request body is not valid JSON." };
  }
};

/** Function URLs lower-case header names; a direct invoke might not. */
const header = (
  event: APIGatewayProxyEventV2,
  name: string,
): string | undefined =>
  event.headers[name] ?? event.headers[name.toLowerCase()];

export const requestOrigin = (
  event: APIGatewayProxyEventV2,
): string | undefined => header(event, "Origin");

export const bearerToken = (event: APIGatewayProxyEventV2): string | null => {
  const match = /^Bearer\s+(\S+)$/i.exec(header(event, "Authorization") ?? "");
  return match?.[1] ?? null;
};
