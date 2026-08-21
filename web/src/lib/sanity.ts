import { createClient, type SanityClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

/**
 * Sanity connection.
 *
 * The whole layer is optional by design. Until the ministry's Sanity project
 * exists, `SANITY_PROJECT_ID` is unset, `enabled` is false, and every getter
 * in `content.ts` falls back to the checked-in data in `src/data/`. That
 * keeps the site building and deploying today, and makes turning the CMS on
 * a matter of setting two environment variables — not a rewrite.
 */
const projectId = import.meta.env.SANITY_PROJECT_ID ?? "";
const dataset = import.meta.env.SANITY_DATASET ?? "production";

export const enabled = Boolean(projectId);

export const client: SanityClient | null = enabled
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2024-10-01",
      // Deliberately NOT the CDN. These queries run once, at build time, and
      // the CDN can serve content up to a minute stale — so a deploy fired
      // straight after someone publishes could bake in the old copy and look
      // like the CMS is broken. The live API is always current, and a static
      // build makes only a handful of requests.
      useCdn: false,
      perspective: "published",
    })
  : null;

const builder = client ? createImageUrlBuilder(client) : null;

export type SanityImage = {
  asset?: { _ref?: string; url?: string; metadata?: { dimensions?: { width: number; height: number } } };
  alt?: string;
};

/** Build a CDN URL for a Sanity image at a given width. */
export function imageUrl(source: SanityImage, width = 1200): string | null {
  if (!builder || !source?.asset) return null;
  return builder.image(source as never).width(width).auto("format").url();
}

/**
 * Run a GROQ query, returning null on any failure.
 *
 * A CMS outage or a bad query must not fail the whole build — the caller
 * falls back to the local content instead. The error is logged so it is
 * visible in the deploy log rather than silently swallowed.
 */
export async function query<T>(groq: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!client) return null;
  try {
    return await client.fetch<T>(groq, params);
  } catch (error) {
    console.warn(`[sanity] query failed, falling back to local content:\n${groq}\n`, error);
    return null;
  }
}
