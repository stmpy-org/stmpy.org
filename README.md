# stmpy.org

Public website for **[StmPy Studio](https://github.com/stmpy-org/stmpy-studio)** — landing, tutorials (from the private `stmpy` docs tree), and downloads.

- **Site:** https://stmpy.org (apex canonical; redirect `www` → apex in Cloudflare)
- **Downloads host:** https://dl.stmpy.org (R2; base URL is `DOWNLOAD_BASE_URL` in `src/data/config.ts`)
- **Stack:** Astro 5 + Starlight, static build → Cloudflare Pages via Wrangler

## Pages

| Path | Content |
|---|---|
| `/`, `/zh-cn/`, `/ja/`, `/es/` | Studio landing (chrome in four locales) |
| `/tutorials/…`, `/zh-cn/tutorials/…` | Docs synced from `stmpy` (`en` + `zh-cn` only) |
| `/ja/tutorials/…`, `/es/tutorials/…` | Fall back to English with Starlight’s untranslated notice |
| `/downloads/` (+ locales) | Studio installers from JSON manifests |

Default locale is **English** at the site root (no browser auto-detect). Use the language switcher in the header.

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

Asset URLs are `${DOWNLOAD_BASE_URL}/${version}/${filename}`. Swap hosts by changing the one config constant (and updating committed manifests if you bake absolute URLs later).

v1 is **Studio only** (no CLI section).

## Deploy (Cloudflare Pages)

GitHub Actions (`.github/workflows/deploy.yml`):

- **PR:** build + link check + Wrangler **preview** deploy (`--branch=<pr-branch>`)
- **`master`:** build + production deploy to Pages project `stmpy-org`

### Secrets (GitHub → Settings → Secrets and variables → Actions)

| Secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token with **Account → Cloudflare Pages → Edit** (and read) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

### One-time Cloudflare setup

1. Create a **Pages** project named `stmpy-org` (direct upload is fine; CI deploys the `dist/` artifact).
2. Attach custom domain **`stmpy.org`** to the project.
3. Add a Cloudflare redirect rule / Bulk Redirect: `www.stmpy.org/*` → `https://stmpy.org/$1` (301).
4. Create R2 bucket + public hostname **`dl.stmpy.org`**, layout `studio/<version>/…` and `studio/latest.json` (placeholder objects OK before real installers exist).

Local deploy smoke test (optional):

```bash
npx wrangler pages deploy dist --project-name=stmpy-org
```

## License

Apache-2.0 — see `LICENSE`.
