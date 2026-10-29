// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import keystatic from '@keystatic/astro';
import { readdirSync } from 'node:fs';

const site = process.env.PUBLIC_SITE_URL || 'https://ernestuwaoma.vercel.app';
const hasNotes = readdirSync('./src/content/notes').some((f) => f.endsWith('.mdoc'));

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [
    react(),
    keystatic(),
    sitemap({
      filter: (page) => !page.includes('/keystatic') && !page.includes('/admin') && (hasNotes || !page.includes('/notes'))
    })
  ],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  build: { format: 'file' }
});
