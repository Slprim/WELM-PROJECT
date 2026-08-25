import type { APIRoute } from "astro";

/**
 * Generated rather than a static file so the sitemap URL always matches the
 * `site` value in astro.config.mjs — a hardcoded domain here would silently
 * point at the wrong host the moment the real one is set.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site).href;

  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${sitemap}
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
