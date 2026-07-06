# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

HargaNaikKe — a Malaysian grocery-price watch board built on KPDN/DOSM
**PriceCatcher** open data. Next.js 15 App Router + React 19 + Tailwind v4,
served as fully static/SSG pages. There is **no runtime backend**: a Python
ingestion script precomputes JSON artifacts into `public/data/`, and the
frontend reads only those.

## Commands

```bash
npm run dev            # dev server on :3000
npm run build          # prod build (runs `prebuild` = build-shop-index first)
npm start              # serve the build

npm run shops          # rebuild public/data/shops/ + shops-index.json from prices/
npm run ingest         # re-pull PriceCatcher → rewrites public/data/*.json (needs .venv)
```

Data refresh (Python 3.10+):

```bash
python3 -m venv .venv && .venv/bin/pip install duckdb pandas
.venv/bin/python ingest/ingest.py     # or: npm run ingest
```

No test suite. **Verify changes by driving the running app** — see the `verify`
skill (`.claude/skills/verify/`): build, `npm start -- -p 3111`, then use the
Claude-in-Chrome tools against `/`, `/item/1355`, `/bakul`. Typecheck with
`npx tsc --noEmit`.

There are no env vars (see `.env.example`). A GitHub Action
(`.github/workflows/refresh-data.yml`) re-runs ingest + shop index daily at
22:00 UTC and commits the data if it changed.

## Data pipeline (the core architecture)

PriceCatcher is **not a REST API** — it's monthly parquet files (~1M+ rows/mo)
at `storage.data.gov.my/pricecatcher`. Two stages precompute everything:

1. **`ingest/ingest.py`** — DuckDB queries the parquet URLs *remotely* (no full
   download), joins the fact table to `lookup_item` / `lookup_premise`, and
   writes: `items.json`, `premises.json`, `trends.json`, `meta.json`, and
   per-item shards `prices/{item_code}.json`. Also emits weekly national history: trends get `spark` (≤12 weekly medians) and price shards are `{rows, hist}`.
2. **`scripts/build-shop-index.mjs`** (npm `prebuild`) — inverts the per-item
   price shards into per-shop shards `shops/{premise_code}.json` plus
   `shops-index.json` (per-shop cheapness `score`). Runs on every build; no-ops
   safely on a fresh clone with no price data.

Sample artifacts are committed, so the app runs immediately without a live pull.

### Window model — read before touching price math

KPDN rotates *which* items get surveyed each day, so there is no single "today's
price." Everything keys off `latest` = max observation date in the data:

- **Current** price = latest observation per item×premise within the last
  `CURRENT_DAYS` (7) days.
- **Previous** price = latest observation in the `PREVIOUS_DAYS` (14) days
  *before* that current window (i.e. days 8–21 back), **not** the immediately
  prior 7 days.
- **Movement / `pct`** = change of the *median* over only premises present in
  **both** windows (avoids mix-shift from premises entering/leaving the sample);
  `null` unless ≥10 such premises. This is what the "vs previous period" stat
  and the risers/fallers board show.
- **Outlier filter**: prices >4× or <¼× the item's national median are dropped
  as survey entry errors before any aggregation.

This is price *surveillance* data, not CPI/inflation — don't present it as
inflation anywhere.

### Data shapes

Price/shop rows are compact positional arrays, not objects (see `lib/types.ts`):

- `prices/{item}.json` row: `[premise_code, price, prev_price|null, iso_date]`,
  pre-sorted cheapest-first.
- `shops/{premise}.json` row: `[item_code, price, prev_price|null, iso_date]`.

## Frontend structure

- **Routes** (`app/`): `/` (home: search, ticker, risers/fallers board),
  `/item/[code]`, `/kedai/[code]` (shop), `/bakul` (basket), `/banding`
  (compare shops). Every dynamic route uses `generateStaticParams` +
  `dynamicParams = false` → all pages prerendered at build (2000+ pages).
- **Server/client split**: each `page.tsx` is a thin server component that
  imports the small committed JSON (`items`/`trends`/`meta`) and passes it to a
  `*Client.tsx` component. The large data (per-item prices, premises, shop
  files) is **fetched client-side and lazily** — never imported into a page, to
  keep the SSG bundle small.
- **`lib/useData.tsx`** — all client data loading. Module-level caches +
  promise dedup so premises/shop-stats load once; per-item/per-shop prices
  cached by code. Basket lives in `localStorage` (`bakul` key) exposed via
  `useBasket()` (`useSyncExternalStore`, syncs across components).
- **`lib/i18n.tsx`** — BM (default) / EN via `useLang()` + `t(key)`. Add every
  user-facing string as a key in **both** `STRINGS.ms` and `STRINGS.en`; lang
  persists to `localStorage`.
- **`lib/format.ts`** — `rm()`, `pctStr()`, `moveClass()`/`moveArrow()`
  (up=naik/red, down=turun/green), `titleCase()`. Reuse these for any price or
  movement rendering.
- **Styling**: Tailwind v4 with an editorial (data-journalism) aesthetic —
  Fraunces display serif (`font-display`), Inter body, JetBrains Mono for
  price/figure columns (`font-mono`). Custom color tokens (`accent`, `dim`,
  `faint`, `hairline`, `panel`, `bg`, `ink`, `naik`, `turun`, `gold`) are
  defined in `app/globals.css` — use them, not raw hex. `.kicker` = small-caps
  section label. Theme is light-paper by default; dark (warm charcoal) toggled
  via `data-theme` on `<html>`.

## Conventions

- Prices/dates flow as positional array tuples end-to-end; keep them compact and
  document any index change in `lib/types.ts`.
- Mobile-first: several columns are `hidden sm:inline`; inputs must compute
  16px font below 640px (iOS zoom rule).
- Commit only when asked. The `refresh-data` workflow auto-commits data files —
  avoid hand-editing `public/data/` (it gets overwritten).
