import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

/**
 * Static output, deliberately.
 *
 * Every page is HTML on disk before a request arrives: that is the whole SEO
 * argument for a local business site, and it is what lets the site live on
 * S3 + CloudFront with no origin server to run or pay for. The gallery and
 * the admin page mount as React islands inside those pages, so the photo
 * library stays live (it reads manifest.json at runtime) while the content
 * stays crawlable.
 *
 * `site` is not decorative: the sitemap and every canonical URL are built
 * from it.
 */
const SITE = "https://marinopavers.com";

/** Dev server port; see `server.port` below. */
const DEV_PORT = 4330;

/** Routes that exist but must never be indexed or listed. */
const HIDDEN_ROUTES = ["/admin"];

export default defineConfig({
  site: SITE,
  output: "static",
  // Emit `/about/index.html` rather than `/about.html` so CloudFront can serve
  // clean URLs from S3 without a rewrite function.
  build: { format: "directory" },
  trailingSlash: "ignore",
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !HIDDEN_ROUTES.some((route) => page.startsWith(`${SITE}${route}`)),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Fail if the port is taken instead of sliding to the next free one. The
    // tunnel is pinned to DEV_PORT, so a silent slide would leave it pointing
    // at nothing — or at whichever other project grabbed the port.
    server: { strictPort: true },
  },
  server: {
    // Not Astro's default 4321: other Astro projects on this machine use it,
    // and the tunnel must never route the client to one of those by mistake.
    // Keep in sync with scripts/tunnel.sh and ~/.cloudflared/marino-dev.yml.
    port: DEV_PORT,
    // The Cloudflare tunnel (scripts/tunnel.sh) fronts the dev server at this
    // hostname; Vite refuses unknown hosts unless they are listed.
    allowedHosts: ["dev.marinopavers.com", ".marinopavers.com"],
  },
});
