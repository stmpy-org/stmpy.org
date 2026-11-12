# Studio demo media

The home page looks for a real recording here first:

| File | Role |
|---|---|
| `studio-demo.webm` | Preferred looping video (muted autoplay) |
| `studio-demo.mp4` | Fallback video |
| `poster.png` | Poster frame while video loads |

If neither video file is present (HTTP 200), the page uses the built-in **CSS/JS Studio mockup** instead (`src/components/StudioDemo.astro`).

## Suggested capture (when you have a board)

1. Run Studio (`npm run tauri dev` in `stmpy-studio`).
2. Record: type the blink example → **Build** succeeds (`.hex` path in the output).
3. With a board connected, continue to **Flash** success; without a board, stop after Build and keep the site mockup’s flash segment, or splice a short success clip later.
4. Export WebM (and optionally MP4), keep under ~3 MB, then drop the files in this folder and redeploy.

Do **not** publish a recording that shows a failed flash (no probe / no board).
