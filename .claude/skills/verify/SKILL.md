---
name: verify
description: Build/launch/drive recipe for verifying harga-naik changes end-to-end
---

# Verifying harga-naik

Next.js 15 static-ish app (SSG item pages). No tests; verify by driving the running app.

## Build + run

```bash
npm run build              # required after any change; next start serves the build
npm start -- -p 3111       # production server (run_in_background)
```

Stop with `lsof -ti :3111 | xargs kill` — `pkill -f "next start"` does NOT match (npm wrapper).
Files added to `public/` need a server restart to be served.

## Drive

Pages: `/` (search, ticker, movers boards), `/item/1355` (stats, selects, price table, share bar), `/bakul` (basket).

Use Claude-in-Chrome tools. Gotcha: `resize_window` silently fails on fullscreen macOS windows (`innerWidth` unchanged) — verify with JS before trusting it.

**Mobile viewport workaround:** copy `mobile-harness.html` (three 390px iframes, one per page) into `public/`, restart server, open `http://localhost:3111/mobile-harness.html`. Same-origin → `javascript_tool` can inspect iframe DOM:

```js
const d = document.getElementById("f1").contentDocument;
d.documentElement.scrollWidth   // >395 means horizontal overflow
```

Remove the harness from `public/` before committing.

## Useful checks

- Theme: `document.documentElement.dataset.theme`, `localStorage.theme`; toggle button labeled DRK/LGT in header.
- Horizontal overflow culprits: `[...d.querySelectorAll("*")].filter(el => el.scrollWidth > 395)`.
- iOS zoom rule: inputs/selects must compute `font-size: 16px` below 640px.
