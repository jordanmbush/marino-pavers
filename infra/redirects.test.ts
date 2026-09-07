import { describe, expect, it } from "vitest";
import { LEGACY_REDIRECTS, redirectInjection } from "./redirects";

/**
 * Runs the injected code the way CloudFront does: at the top of a handler
 * that receives `event` and otherwise returns the request. A syntax error
 * here would take the whole distribution down, so the code is executed, not
 * just string-matched.
 */
type Querystring = Record<string, { value: string }>;

const handle = (uri: string, querystring: Querystring = {}) => {
  const handler = new Function(
    "event",
    `${redirectInjection()}\n  return event.request;`,
  ) as (event: unknown) => {
    statusCode?: number;
    headers?: { location: { value: string } };
    uri?: string;
  };
  return handler({ request: { uri, querystring, headers: {} } });
};

describe("legacy redirects", () => {
  it("send the retired pages to where their content went", () => {
    expect(handle("/about")).toMatchObject({
      statusCode: 301,
      headers: { location: { value: "/" } },
    });
    expect(handle("/contact")).toMatchObject({
      statusCode: 301,
      headers: { location: { value: "/" } },
    });
    expect(handle("/our-work")).toMatchObject({
      statusCode: 301,
      headers: { location: { value: "/gallery" } },
    });
  });

  it("accept a trailing slash and keep the query string", () => {
    expect(handle("/our-work/").headers?.location.value).toBe("/gallery");
    expect(
      handle("/our-work", { category: { value: "pool-decks" } }).headers
        ?.location.value,
    ).toBe("/gallery?category=pool-decks");
  });

  it("leave every other path to the router, untouched", () => {
    for (const uri of [
      "/",
      "/gallery",
      "/es/services/",
      "/aboutus",
      "/about/team",
    ]) {
      expect(handle(uri), uri).toEqual({ uri, querystring: {}, headers: {} });
    }
  });

  it("only ever point at pages the site builds", () => {
    const built = ["/", "/services", "/gallery"];
    for (const target of Object.values(LEGACY_REDIRECTS))
      expect(built).toContain(target);
  });
});
