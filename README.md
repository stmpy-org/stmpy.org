# stmpy.org

Public website for **[StmPy Studio](https://github.com/stmpy-org/stmpy-studio)** — landing, tutorials (from the private `stmpy` docs tree), and downloads.

- **Site:** https://stmpy.org (apex canonical; redirect `www` → apex in Cloudflare)
- **Downloads host:** https://dl.stmpy.org (R2; base URL is `DOWNLOAD_BASE_URL` in `src/data/config.ts`)
- **Stack:** Astro 5 + Starlight (tutorials) + custom marketing pages, static → Cloudflare Pages via Wrangler

## Pages

| Path | Content |
|---|---|
| `/`, `/zh-cn/`, `/ja/`, `/es/` | Studio marketing home (custom Astro pages) |
| `/downloads/` (+ locales) | Standalone downloads (not inside Starlight sidebar) |
| `/tutorials/…` (+ locales) | Docs synced from `stmpy` (`en` + `zh-cn`; ja/es fall back to EN) |

Default locale is **English** at `/` (no browser auto-detect). Use the language switcher in the header.

## Home demo (Studio workflow)

The hero includes a **write → build → flash success** demo.

**Current route: CSS/JS mockup** styled like real StmPy Studio (`src/components/StudioDemo.astro`): types the blink example, runs Build (shows `.hex` output), then shows a designed Flash success using the same probe-rs-style lines Studio prints. No board is required; the flash step is not a live probe session.

To swap in a **real recording** later (e.g. once a board is connected):

1. Put files in `public/media/studio-demo/`:
   - `studio-demo.webm` (preferred) and/or `studio-demo.mp4`
   - optional `poster.png`
2. Keep the clip small (ideally &lt; 3 MB), muted, looping.
3. Capture **typing + Build success**; only include Flash if it actually succeeds on hardware. Do not publish a failed flash.
4. Redeploy. The page prefers video when those files return HTTP 200; otherwise it keeps the mockup.

See `public/media/studio-demo/README.md`.

## Develop

```bash
npm ci
npm run dev
```

```bash
npm run build
npm run preview
npm run check:links   # after build; scans dist/ for broken internal hrefs
```

## Sync tutorials from stmpy

`stmpy` stays private. Sync is **manual** from a local checkout at a git tag (uses `git archive`, not the dirty working tree):

```bash
npm run sync-docs -- --tag v0.0.2 --from ../stmpy
```

This writes:

- `vendor/stmpy-docs/<tag>/` — raw docs snapshot
- `src/content/docs/tutorials/` and `src/content/docs/zh-cn/tutorials/` — Starlight pages (`order` → `sidebar.order`)
- `docs-source.lock.json` — pinned tag + commit

Commit the result when you bump the docs pin. Tutorials follow **stmpy** tags (currently `v0.0.2`), not Studio tags.

## Downloads data

- `src/data/config.ts` — `DOWNLOAD_BASE_URL` (`https://dl.stmpy.org/studio`)
- `src/data/downloads/latest.json` — current stable version pointer
- `src/data/downloads/<version>.json` — assets named `stmpy-studio-{version}-{platform}{ext}`

Asset URLs are `${DOWNLOAD_BASE_URL}/${version}/${filename}`.

v1 is **Studio only** (no CLI section).

## Deploy (Cloudflare Pages)

GitHub Actions (`.github/workflows/deploy.yml`):

- **PR:** build + link check + Wrangler **preview** deploy
- **`master`:** production deploy to Pages project `stmpy-org`

### Secrets

| Secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Account → Cloudflare Pages → Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

### One-time Cloudflare setup

1. Pages project **`stmpy-org`**
2. Custom domain **`stmpy.org`**; redirect **www → apex**
3. R2 + **`dl.stmpy.org`** under `studio/<version>/…`

## License

Apache-2.0 — see `LICENSE`.
