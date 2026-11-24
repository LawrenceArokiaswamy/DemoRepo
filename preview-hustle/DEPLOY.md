# Hosting a preview link

The site is plain HTML, so any static host works. Every page has `noindex`, and `robots.txt` blocks crawlers.

## Option A: Cloudflare Pages (recommended; free; the link lasts until you delete it)
One-time setup: create a free Cloudflare account, install Node.js, then:
```bash
npx wrangler login
```
For each preview:
```bash
npx wrangler pages deploy previews/static-electrical/site --project-name=preview-static-electrical
```
You'll get a link like `https://preview-static-electrical.pages.dev`. Delete the project in the Cloudflare dashboard when the preview expires.

## Option B: Netlify Drop (no account, quick test only)
Drag the `site` folder onto https://app.netlify.com/drop. Unclaimed sites are deleted after about an hour, so use this only to check how it looks on your phone.

## New preview for another business (about 20 minutes)
1. `cp -r previews/static-electrical previews/<new-slug>` and delete its `site/` and `screenshots/` folders.
2. Edit `site.json` using **only** facts from their site or Google profile. Leave anything you don't know out. Record your sources in `content-source.md`.
3. `python3 template/build.py previews/<new-slug>`
4. Open `previews/<new-slug>/site/index.html` on your computer, then deploy and check it on your phone.
