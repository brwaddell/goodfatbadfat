// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';

const SITE_URL = 'https://goodfatbadfat.com';
const githubPages = process.env.GITHUB_PAGES === 'true';

// GitHub Pages is a static host. The Node adapter and Keystatic stay available
// for a local server, and are omitted from the public Pages build.
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  ...(githubPages ? {} : { adapter: node({ mode: 'standalone' }) }),
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/keystatic') &&
        !page.includes('/api/') &&
        !page.endsWith('/404') &&
        !page.endsWith('/404/'),
    }),
    ...(githubPages || process.env.SKIP_KEYSTATIC === 'true' ? [] : [keystatic()]),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
