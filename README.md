# HARGA NAIK_

Papan pantau harga barang keperluan Malaysia — a grocery-price terminal built on
[PriceCatcher](https://data.gov.my/data-catalogue/pricecatcher) open data from
KPDN & DOSM.

Search any tracked item and see its price spread across ~4,000 premises
nationwide, find the cheapest premise in your state/district, build a basket
("Bakul Saya") and find the single cheapest premise for the whole basket, and
watch the "Barang Naik" board for the staples that moved most this period.
Bahasa Melayu by default, English toggle, WhatsApp-shareable price cards.

## Architecture

```
storage.data.gov.my (parquet)          ingest/ingest.py (Python + DuckDB)
├─ pricecatcher_YYYY-MM.parquet   ──►  join star schema remotely, aggregate  ──►  public/data/*.json
├─ lookup_item.parquet                                                             ├─ items.json
└─ lookup_premise.parquet                                                          ├─ premises.json
                                                                                   ├─ prices/{item_code}.json
Next.js App Router (static)       ◄──  reads precomputed JSON only                 ├─ trends.json
                                                                                   └─ meta.json
```

PriceCatcher is **not** a REST API — it is distributed as monthly parquet files
(~1M+ rows/month). The ingestion script queries the parquet URLs directly with
DuckDB (no full download, no pandas row iteration), joins the fact table to the
item and premise lookups, and writes small precomputed JSON artifacts. The
frontend never touches parquet.

Key ingestion decisions:

- **Windows, not calendar months.** KPDN rotates which items are surveyed each
  day, so "current price" = latest observation per item x premise over the last
  7 days of available data; "previous" = the latest observation in the 14 days
  before that. Movement = median change over premises present in both windows
  (avoids mix-shift).
- **Month-boundary fallback.** The current month's file may not exist yet early
  in the month; the script probes and falls back, and always pulls the prior
  month too so the comparison window is populated.
- **Outlier filter.** Prices more than 4x away from the item's national median
  (obvious survey entry errors, e.g. RM1.20/kg chicken) are dropped.
- **Per-item price shards.** `prices/{item_code}.json` keeps each fetch small;
  the basket page fetches only the items in the basket.

Sample artifacts are committed, so the app runs immediately without a live pull.

## Setup

```bash
# frontend (artifacts already committed)
npm install
npm run dev            # http://localhost:3000

# refresh data (Python 3.10+)
python3 -m venv .venv && .venv/bin/pip install duckdb pandas
.venv/bin/python ingest/ingest.py     # rewrites public/data/
```

Deploy on Vercel as a normal Next.js app. Refresh = re-run the ingestion script
on a schedule (cron/GitHub Action) and redeploy; there is no runtime backend.
No environment variables are required (see `.env.example`).

## Data, licence & caveats

- Data: **PriceCatcher**, Kementerian Perdagangan Dalam Negeri dan Kos Sara
  Hidup (KPDN) & Department of Statistics Malaysia (DOSM), via
  [data.gov.my](https://data.gov.my/data-catalogue/pricecatcher), licensed
  **CC BY 4.0**.
- PriceCatcher is **price surveillance data, not an inflation measure**. Nothing
  in this app is CPI; for inflation, refer to DOSM's official CPI releases.
- The data has no coordinates, so "near me" is an honest state → district
  picker, not GPS radius.
