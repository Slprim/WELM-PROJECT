// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://welm.org',

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
});
