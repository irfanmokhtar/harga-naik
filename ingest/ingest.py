#!/usr/bin/env python3
"""
Harga Naik — PriceCatcher ingestion.

Reads KPDN/DOSM PriceCatcher parquet files directly from storage.data.gov.my
via DuckDB, joins the star schema, and emits small precomputed JSON artifacts
for the frontend under public/data/.

Data: PriceCatcher, KPDN & DOSM, CC BY 4.0.
Note: PriceCatcher is price surveillance data, not CPI/inflation measurement.

Usage:
    python ingest/ingest.py [--out public/data]
"""

import argparse
import json
import sys
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

import duckdb

BASE = "https://storage.data.gov.my/pricecatcher"

# "Current" price = latest observation per item x premise in the last
# CURRENT_DAYS days of available data. "Previous" = latest observation in the
# PREVIOUS_DAYS days before that. KPDN surveys rotate items across days, so a
# 7-day window is needed to cover the full item list.
CURRENT_DAYS = 7
PREVIOUS_DAYS = 14


def month_str(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}"


def prev_month(year: int, month: int) -> tuple[int, int]:
    return (year - 1, 12) if month == 1 else (year, month - 1)


def url_exists(url: str) -> bool:
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status == 200
    except Exception:
        return False


def find_fact_urls(today: date) -> list[str]:
    """Latest available monthly file plus the month before it (the current
    month's file may not exist yet early in the month)."""
    y, m = today.year, today.month
    if not url_exists(f"{BASE}/pricecatcher_{month_str(y, m)}.parquet"):
        y, m = prev_month(y, m)
        if not url_exists(f"{BASE}/pricecatcher_{month_str(y, m)}.parquet"):
            sys.exit(f"No PriceCatcher file found for {today} or the month before.")
    py, pm = prev_month(y, m)
    urls = [f"{BASE}/pricecatcher_{month_str(y, m)}.parquet"]
    prev_url = f"{BASE}/pricecatcher_{month_str(py, pm)}.parquet"
    if url_exists(prev_url):
        urls.append(prev_url)
    return urls


def run(out_dir: Path) -> None:
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")

    fact_urls = find_fact_urls(date.today())
    print(f"fact files: {fact_urls}")

    con.execute(f"""
        CREATE VIEW item AS
        SELECT item_code::BIGINT AS item_code, item, unit, item_group, item_category
        FROM '{BASE}/lookup_item.parquet'
        WHERE item_code > 0 AND item IS NOT NULL
    """)
    con.execute(f"""
        CREATE VIEW premise AS
        SELECT premise_code::BIGINT AS premise_code, premise, address,
               premise_type, state, district
        FROM '{BASE}/lookup_premise.parquet'
        WHERE premise_code > 0 AND premise IS NOT NULL
    """)
    fact_list = "[" + ", ".join(f"'{u}'" for u in fact_urls) + "]"
    con.execute(f"""
        CREATE VIEW fact AS
        SELECT date, premise_code::BIGINT AS premise_code,
               item_code::BIGINT AS item_code, price
        FROM read_parquet({fact_list})
        WHERE price IS NOT NULL AND price > 0
          AND item_code IN (SELECT item_code FROM item)
          AND premise_code IN (SELECT premise_code FROM premise)
    """)

    latest = con.execute("SELECT max(date) FROM fact").fetchone()[0]
    print(f"latest observation date: {latest}")

    # Drop obvious survey entry errors (e.g. RM1.20/kg chicken): prices
    # further than 4x from the item's national median.
    n_before = con.execute("SELECT count(*) FROM fact").fetchone()[0]
    con.execute("""
        CREATE TABLE fact_clean AS
        WITH item_med AS (
            SELECT item_code, median(price) AS med FROM fact GROUP BY 1
        )
        SELECT f.* FROM fact f JOIN item_med m USING (item_code)
        WHERE f.price BETWEEN m.med / 4 AND m.med * 4
    """)
    con.execute("DROP VIEW fact")
    con.execute("ALTER TABLE fact_clean RENAME TO fact")
    n_after = con.execute("SELECT count(*) FROM fact").fetchone()[0]
    print(f"outlier filter: dropped {n_before - n_after:,} of {n_before:,} rows")

    # Latest price per item x premise in each window.
    con.execute(f"""
        CREATE TABLE cur AS
        SELECT item_code, premise_code,
               arg_max(price, date) AS price, max(date) AS d
        FROM fact
        WHERE date > DATE '{latest}' - INTERVAL {CURRENT_DAYS} DAY
        GROUP BY 1, 2
    """)
    con.execute(f"""
        CREATE TABLE prev AS
        SELECT item_code, premise_code,
               arg_max(price, date) AS price, max(date) AS d
        FROM fact
        WHERE date <= DATE '{latest}' - INTERVAL {CURRENT_DAYS} DAY
          AND date > DATE '{latest}' - INTERVAL {CURRENT_DAYS + PREVIOUS_DAYS} DAY
        GROUP BY 1, 2
    """)
    n_cur, n_prev = (con.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
                     for t in ("cur", "prev"))
    print(f"current pairs: {n_cur:,}  previous pairs: {n_prev:,}")

    out_dir.mkdir(parents=True, exist_ok=True)
    prices_dir = out_dir / "prices"
    prices_dir.mkdir(exist_ok=True)
    for old in prices_dir.glob("*.json"):
        old.unlink()

    def dump(name: str, obj) -> None:
        path = out_dir / name
        path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
        print(f"wrote {path} ({path.stat().st_size / 1024:.0f} KB)")

    # items.json — only items with a current price
    items = con.execute("""
        SELECT i.item_code, i.item, i.unit, i.item_group, i.item_category,
               count(*) AS n_premise
        FROM item i JOIN cur c USING (item_code)
        GROUP BY 1, 2, 3, 4, 5 ORDER BY i.item
    """).fetchall()
    dump("items.json", [
        {"code": r[0], "name": r[1], "unit": r[2], "group": r[3],
         "category": r[4], "n": r[5]}
        for r in items
    ])

    # premises.json — only premises with a current price
    premises = con.execute("""
        SELECT p.premise_code, p.premise, p.address, p.premise_type,
               p.state, p.district
        FROM premise p JOIN (SELECT DISTINCT premise_code FROM cur) c
            USING (premise_code)
        ORDER BY p.state, p.district, p.premise
    """).fetchall()
    dump("premises.json", [
        {"code": r[0], "name": r[1], "address": r[2], "type": r[3],
         "state": r[4], "district": r[5]}
        for r in premises
    ])

    # prices/{item_code}.json — per-premise current + previous price.
    # Compact row arrays: [premise_code, price, prev_price|null, date]
    rows = con.execute("""
        SELECT c.item_code, c.premise_code, c.price, p.price, c.d
        FROM cur c LEFT JOIN prev p USING (item_code, premise_code)
        ORDER BY c.item_code, c.price, c.premise_code
    """).fetchall()
    by_item: dict[int, list] = {}
    for item_code, premise_code, price, prev_price, d in rows:
        by_item.setdefault(item_code, []).append(
            [premise_code, round(price, 2),
             round(prev_price, 2) if prev_price is not None else None,
             d.isoformat()])
    for item_code, item_rows in by_item.items():
        (prices_dir / f"{item_code}.json").write_text(
            json.dumps(item_rows, separators=(",", ":")))
    print(f"wrote {len(by_item)} files to {prices_dir}/")

    # trends.json — per-item aggregates; change = current vs previous median
    # over premises reporting in both windows (avoids mix-shift from
    # premises entering/leaving the sample).
    trends = con.execute("""
        SELECT c.item_code,
               min(c.price), median(c.price), max(c.price), count(*),
               median(c.price) FILTER (p.price IS NOT NULL),
               median(p.price) FILTER (p.price IS NOT NULL),
               count(*) FILTER (p.price IS NOT NULL)
        FROM cur c LEFT JOIN prev p USING (item_code, premise_code)
        GROUP BY 1
    """).fetchall()
    trend_rows = []
    for code, mn, med, mx, n, cur_med, prev_med, n_both in trends:
        pct = None
        if prev_med and n_both >= 10:
            pct = round((cur_med - prev_med) / prev_med * 100, 2)
        trend_rows.append({
            "code": code, "min": round(mn, 2), "med": round(med, 2),
            "max": round(mx, 2), "n": n,
            "prevMed": round(prev_med, 2) if prev_med is not None else None,
            "pct": pct,
        })
    dump("trends.json", trend_rows)

    dump("meta.json", {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "latestDate": latest.isoformat(),
        "currentWindowDays": CURRENT_DAYS,
        "previousWindowDays": PREVIOUS_DAYS,
        "sources": fact_urls,
        "license": "CC BY 4.0 — KPDN & DOSM (data.gov.my PriceCatcher)",
    })

    # sanity: 10 joined rows
    print("\nsanity — 10 joined rows:")
    for r in con.execute("""
        SELECT i.item, c.price, p.premise, p.district, p.state, c.d
        FROM cur c JOIN item i USING (item_code) JOIN premise p USING (premise_code)
        USING SAMPLE 10
    """).fetchall():
        print(f"  RM{r[1]:>7.2f}  {r[0][:44]:<44}  {r[2][:30]:<30} {r[3]}, {r[4]}  {r[5]}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/data", type=Path)
    run(ap.parse_args().out)
