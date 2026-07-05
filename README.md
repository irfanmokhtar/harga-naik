# HargaNaikKe

**Papan pantau harga barang keperluan Malaysia** — a grocery-price watch board
built on [PriceCatcher](https://data.gov.my/data-catalogue/pricecatcher) open
data from KPDN (Kementerian Perdagangan Dalam Negeri dan Kos Sara Hidup) & DOSM
(Department of Statistics Malaysia).

Track any surveyed grocery item's price across thousands of premises nationwide,
find the cheapest shop in your state or district, build a shopping basket and
discover the single cheapest premise for the whole lot, compare two shops
side-by-side, and watch which staples moved most this period. Bahasa Melayu by
default with an English toggle, and every view is shareable to WhatsApp.

> **Not an inflation measure.** PriceCatcher is price *surveillance* data. Nothing
> here is CPI — for inflation, refer to DOSM's official CPI releases.

## Features

### Home — search & movement board
- **Instant search** across all tracked items in BM or English (matches
  Malay/English names). Desktop auto-focuses the search box; typing also surfaces
  matching **shops/premises** with their cheapness score.
- **Ticker** of the biggest movers scrolling across the top.
- **Barang Naik / Barang Turun boards** — the biggest median price risers and
  fallers vs the previous period, side by side.

### Item page (`/item/[code]`)
- **Stats strip**: cheapest, median, highest price, and **% change vs the
  previous period**, plus a visual min–median–max **range bar**.
- **Location filter** — narrow every stat and the price table to a state and/or
  district (an honest picker, since the data carries no GPS coordinates).
- **Price spread table** — every premise's current price, its change vs that
  premise's own previous price, location, and observation date. Cheapest row is
  highlighted. **Sortable** by price or by latest data date via the column
  headers; paginated with show-all.
- **Add to basket** and a **share bar**: share to WhatsApp, copy formatted text,
  or **download a PNG price card** (rendered client-side on a canvas).

### Basket — "Bakul Saya" (`/bakul`)
- Add items via inline search; basket persists in `localStorage`.
- **Cheapest-premise finder** — ranks premises by the total cost of the whole
  basket, preferring premises that stock **every** item (full coverage) then
  cheapest total. Winner is called out with a WhatsApp share.
- **"At this shop"** — pick your usual shop to see its basket total, how much
  more it costs than the cheapest option, and which basket items it doesn't
  stock.
- Location filter applies to the ranking; a full ranking table lists the top
  premises with coverage counts.

### Shop page (`/kedai/[code]`)
- **Cheapness score** — the % of this shop's items priced below the item's
  national median — plus item count and data date.
- **Full price list** for the shop, each item tagged **MURAH / MAHAL / neutral**
  by how far its price sits from the national median, best deals first.
- One-click deep link into the shop comparison tool.

### Compare shops — "Banding" (`/banding`)
- Pick two premises and see a **side-by-side price table** for every item they
  have in common, cheaper side highlighted per row, with a **common-items
  total** at the bottom.
- Selections are encoded in the URL (`?a=&b=`), so a comparison is a shareable
  deep link.

### Everywhere
- **Bilingual** BM/EN toggle (persisted), **dark/light theme** toggle, and a
  terminal-inspired UI. Movement is colour-coded (naik = up/red, turun =
  down/green).

## Architecture

```
storage.data.gov.my (parquet)          ingest/ingest.py (Python + DuckDB)
├─ pricecatcher_YYYY-MM.parquet   ──►  join star schema remotely, aggregate  ──►  public/data/*.json
├─ lookup_item.parquet                                                             ├─ items.json
└─ lookup_premise.parquet                                                          ├─ premises.json
                                                                                   ├─ prices/{item_code}.json
Next.js App Router (static SSG)   ◄──  reads precomputed JSON only                 ├─ trends.json
                                                                                   ├─ meta.json
scripts/build-shop-index.mjs      ──►  inverts prices → per-shop shards            ├─ shops/{premise}.json
  (npm prebuild)                                                                    └─ shops-index.json
```

There is **no runtime backend**. PriceCatcher is **not** a REST API — it is
distributed as monthly parquet files (~1M+ rows/month). The ingestion script
queries the parquet URLs directly with DuckDB (no full download, no pandas row
iteration), joins the fact table to the item and premise lookups, and writes
small precomputed JSON artifacts. A second build step inverts the per-item price
shards into per-shop shards and a cheapness index. The frontend reads only those
JSON files; item and shop pages are prerendered at build time (thousands of
static pages), and the large data is fetched lazily on the client.

Key ingestion decisions:

- **Windows, not calendar months.** KPDN rotates which items are surveyed each
  day, so "current price" = latest observation per item × premise over the last
  **7 days** of available data; "previous" = the latest observation in the **14
  days before** that window (days 8–21 back, not the immediately prior 7 days).
  Movement = median change over premises present in **both** windows (avoids
  mix-shift from premises entering/leaving the sample), reported only when ≥10
  such premises exist.
- **Month-boundary fallback.** The current month's file may not exist yet early
  in the month; the script probes and falls back, and always pulls the prior
  month too so the comparison window is populated.
- **Outlier filter.** Prices more than 4× away from the item's national median
  (obvious survey entry errors, e.g. RM1.20/kg chicken) are dropped.
- **Per-item price shards.** `prices/{item_code}.json` keeps each fetch small;
  the basket page fetches only the items in the basket.

Price and shop rows are stored as compact positional arrays, not objects:
`prices/{item}.json` → `[premise_code, price, prev_price|null, iso_date]`;
`shops/{premise}.json` → `[item_code, price, prev_price|null, iso_date]`.

Sample artifacts are committed, so the app runs immediately without a live pull.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · DuckDB
(ingestion) · deployed as a static site (Vercel).

## Setup

```bash
# frontend (artifacts already committed)
npm install
npm run dev            # http://localhost:3000

# refresh data (Python 3.10+)
python3 -m venv .venv && .venv/bin/pip install duckdb pandas
.venv/bin/python ingest/ingest.py     # or: npm run ingest — rewrites public/data/
```

Other scripts:

```bash
npm run build          # production build (prebuild rebuilds the shop index first)
npm start              # serve the build
npm run shops          # rebuild public/data/shops/ + shops-index.json only
```

Deploy on Vercel as a normal Next.js app; no environment variables are required
(see `.env.example`). Data refresh is automated by a GitHub Action
(`.github/workflows/refresh-data.yml`) that re-runs the ingestion + shop index
daily at 22:00 UTC (06:00 MYT, after KPDN's overnight publish window) and commits
the data if it changed. Refreshing manually = re-run the ingestion script and
redeploy; there is no runtime backend to update.

## Data, licence & caveats

- Data: **PriceCatcher**, Kementerian Perdagangan Dalam Negeri dan Kos Sara
  Hidup (KPDN) & Department of Statistics Malaysia (DOSM), via
  [data.gov.my](https://data.gov.my/data-catalogue/pricecatcher), licensed
  **CC BY 4.0**.
- PriceCatcher is **price surveillance data, not an inflation measure**. Nothing
  in this app is CPI; for inflation, refer to DOSM's official CPI releases.
- The data has no coordinates, so "near me" is an honest state → district
  picker, not a GPS radius.
