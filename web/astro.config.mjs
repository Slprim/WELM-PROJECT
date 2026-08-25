// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // The public domain. Set SITE_URL in web/.env (and before any production
  // build) to the Namecheap domain — it is what the sitemap and robots.txt
  // are written against, and canonical/OG tags point at.
  site: process.env.SITE_URL || 'https://kingdomofgods.org',

  image: {
    // Sanity serves uploaded images from its own CDN; Astro will only
    // optimise remote images from hosts listed here.
    domains: ['cdn.sanity.io'],
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Lightning CSS folds `animation-timeline` into the `animation`
      // shorthand (`animation: linear both drift view()`), which is invalid —
      // the shorthand resets the timeline — so browsers drop the whole
      // declaration and every scroll-driven animation silently dies.
      // esbuild leaves the longhand alone.
      cssMinify: 'esbuild',
    },
  },

  integrations: [sitemap()],
});