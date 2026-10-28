# GoodFat marketing site & CMS

Astro + Tailwind landing page and Keystatic CMS for GoodFat. Reuses the app’s navy/gold tokens, droplet mascot, and product language (inflammatory score, omega‑6:3, NOVA).

## Develop

```bash
cd site
npm install
npm run dev
```

The site will run on `http://localhost:4321`. In development, Keystatic runs at `http://localhost:4321/keystatic`.

## Build & Run

```bash
npm run build
npm run start
```

Runs the Node server on the configured `PORT` and `HOST` (defaults to port `8080` or the `PORT` env var). The start wrapper applies HTTPS redirects and security headers to both prerendered files and server routes.

## GitHub Pages

This repository is the public website. The app stays in the private `brwaddell/GoodFat` repo, which cannot use GitHub Pages on the current plan. GitHub Actions (`.github/workflows/pages.yml`) builds with `GITHUB_PAGES=true`, which omits the Node adapter, Keystatic, and `/api/contact`. The support form opens the visitor’s email app.

```bash
GITHUB_PAGES=true npm run build
```

`goodfatbadfat.com` DNS lives on Cloudflare and proxies to GitHub Pages. Keep the web records DNS-only until GitHub finishes the certificate, then proxy them and set SSL/TLS to Full (strict). Do not use Flexible. Leave mail records untouched if any are added later. Keystatic is not on the public host.

Blog posts live in `src/content/blog`. Edit them in git. Keystatic is not part of the public site.

Public routes include `/privacy`, `/terms`, `/support`, `/blog`, `/sitemap-index.xml`, and `/robots.txt`.
