/**
 * URLs the live site used to answer and no longer builds. Search engines and
 * old links still know them, so CloudFront answers 301 at the edge, before
 * any routing, and nobody lands on the 404.
 *
 * Keys are paths without a trailing slash; a request with one matches too.
 * The query string travels along (`/our-work?category=turf`).
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/about": "/",
  "/contact": "/",
  "/our-work": "/gallery",
};

/**
 * The redirect as CloudFront Function code, for the Router's viewer-request
 * injection. SST pastes it at the top of the handler, with `event` in scope;
 * returning a response object there short-circuits the request. Written in
 * the JavaScript the `cloudfront-js-2.0` runtime supports — no optional
 * chaining, no spread, no template literals — and kept small: the whole
 * function has a 10 KB budget shared with SST's own routing code.
 */
export const redirectInjection = (redirects = LEGACY_REDIRECTS): string => `
  var redirects = ${JSON.stringify(redirects)};
  var legacyPath = event.request.uri.replace(/\\/+$/, "") || "/";
  if (Object.prototype.hasOwnProperty.call(redirects, legacyPath)) {
    var qs = event.request.querystring || {};
    var pairs = Object.keys(qs).map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(qs[key].value);
    });
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: {
          value: redirects[legacyPath] + (pairs.length ? "?" + pairs.join("&") : ""),
        },
      },
    };
  }
`;
