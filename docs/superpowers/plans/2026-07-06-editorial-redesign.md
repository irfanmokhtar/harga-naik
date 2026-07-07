# HargaNaikKe Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle HargaNaikKe from terminal-mono to editorial data-journalism design (paper-light default, Fraunces/Inter/JetBrains type trio, navy accent), add weekly price history to the ingest pipeline, and add sparkline + trend-chart components — keeping every existing feature and all logic intact.

**Architecture:** In-place restyle. Design tokens live in `app/globals.css` `@theme` (Tailwind v4); fonts load via `next/font/google` in `app/layout.tsx`. `ingest/ingest.py` gains weekly national aggregates; `prices/{code}.json` changes shape to `{rows, hist}` with defensive normalization in `lib/useData.tsx` so old-shape data still works. Each page's `*Client.tsx` is rewritten presentation-only.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, `next/font`, DuckDB (Python ingest), hand-rolled SVG charts (no chart library).

**Spec:** `docs/superpowers/specs/2026-07-06-editorial-redesign-design.md`

## Global Constraints

- No test suite exists. Verification per task = `npx tsc --noEmit` (must print nothing) plus the exact commands given in the task. Final task drives the running app per `.claude/skills/verify/`.
- Every new user-facing string goes in **both** `STRINGS.ms` and `STRINGS.en` in `lib/i18n.tsx`.
- Inputs must render 16px font below 640px (`text-[16px] sm:text-...`) — iOS zoom rule.
- All pages stay SSG: do not touch `generateStaticParams` / `dynamicParams = false` / server-vs-client data split.
- Data rows stay compact positional arrays; document shape changes in `lib/types.ts`.
- Never present data as inflation/CPI.
- Color tokens: use token classes (`bg-bg`, `text-ink`, `text-dim`, `text-faint`, `border-hairline`, `bg-panel`, `text-accent`, `text-naik`, `text-turun`, `bg-gold`) — never raw hex in components.
- The legacy `--color-acid` alias exists only during migration (Task 1 adds it, Task 12 removes it). New/rewritten code must use `accent`, never `acid`.
- Palette is pre-validated (WCAG AA text contrast ≥4.5:1 both themes; naik↔turun CVD ΔE ≥18). Do not change hex values.
- Commit after each task with the given message; end commit messages with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Design tokens, fonts, theme boot

**Files:**
- Modify: `app/globals.css` (full replace)
- Modify: `app/layout.tsx` (full replace)
- Modify: `components/ThemeToggle.tsx` (full replace)

**Interfaces:**
- Produces: color tokens `accent`, `gold` (plus existing names `bg/panel/ink/dim/faint/hairline/naik/turun`); font utilities `font-sans` (body default), `font-display` (Fraunces), `font-mono` (JetBrains, tabular); CSS class `.kicker` (small-caps section label); light theme default, `html[data-theme="dark"]` override. Temporary `--color-acid` alias keeps old `text-acid` etc. rendering until Task 12. (Task 6 later changes `<Footer />` to `<Footer meta={meta} />` in this same layout file.)

- [ ] **Step 1: Replace `app/globals.css` entirely with:**

```css
@import "tailwindcss";

@theme {
  /* paper editorial — light is the default theme */
  --color-bg: #faf7f0;
  --color-panel: #f2eee2;
  --color-ink: #1c1a17;
  --color-dim: #6f6a5e;
  --color-faint: #a29b8a;
  --color-hairline: #e3ddcf;
  --color-accent: #23479c;
  --color-naik: #b23a24;
  --color-turun: #1e6b4f;
  --color-gold: #f3ead0;
  --color-selection-ink: #faf7f0;
  /* legacy alias for the old terminal accent — removed in cleanup task */
  --color-acid: #23479c;

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-fraunces), Georgia, "Times New Roman", serif;
  --font-mono: var(--font-jetbrains), ui-monospace, "SF Mono", Menlo, monospace;
}

/* warm charcoal — dark theme overrides */
html[data-theme="dark"] {
  --color-bg: #171412;
  --color-panel: #211d18;
  --color-ink: #ece7dc;
  --color-dim: #a89f8f;
  --color-faint: #6e6659;
  --color-hairline: #322d26;
  --color-accent: #93a9e4;
  --color-naik: #e2694f;
  --color-turun: #58b189;
  --color-gold: #2a2417;
  --color-selection-ink: #171412;
  --color-acid: #93a9e4;
}

html {
  background: var(--color-bg);
  color: var(--color-ink);
  color-scheme: light;
}

html[data-theme="dark"] {
  color-scheme: dark;
}

body {
  font-family: var(--font-sans);
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
}

/* serif display text uses proportional lining figures (big numbers look loose in tabular) */
.font-display {
  font-variant-numeric: lining-nums proportional-nums;
  letter-spacing: -0.01em;
}

/* price/figure columns align with tabular numerals */
.font-mono {
  font-variant-numeric: tabular-nums lining-nums;
}

/* small-caps section label — the editorial kicker */
.kicker {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-dim);
}

::selection {
  background: var(--color-accent);
  color: var(--color-selection-ink);
}

/* mechanical ticker — constant-speed marquee, no easing */
@keyframes ticker {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.ticker-track {
  animation: ticker 120s linear infinite;
}

.ticker-track:hover {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    animation: none;
  }
}

/* hairline table rows */
.row-line {
  border-bottom: 1px solid var(--color-hairline);
}

input,
select {
  font-family: inherit;
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='6'><path d='M0 0h8L4 6z' fill='%236f6a5e'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

html[data-theme="dark"] select {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='6'><path d='M0 0h8L4 6z' fill='%23a89f8f'/></svg>");
}
```

- [ ] **Step 2: Replace `app/layout.tsx` entirely with:**

```tsx
import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import meta from "@/public/data/meta.json";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "HargaNaikKe — papan harga barang Malaysia",
  description:
    "Semak harga barang keperluan di seluruh Malaysia. Data PriceCatcher KPDN & DOSM.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ms"
      className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.theme;document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg text-ink flex flex-col">
        <LangProvider>
          <Header latestDate={meta.latestDate} />
          <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-16">
            {children}
          </main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
```

Note: light is now the deterministic default (no OS-preference fallback); only a stored `localStorage.theme === "dark"` yields dark. Content column narrows `max-w-5xl` → `max-w-4xl`.

- [ ] **Step 3: Replace `components/ThemeToggle.tsx` entirely with:**

```tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    );
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.theme = next;
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="px-2 py-1.5 text-[13px] text-dim hover:text-ink cursor-pointer"
      aria-label="Tukar tema / switch theme"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
```

(The OS-preference live-follow listener is removed deliberately — theme is now explicit: light default, stored choice wins.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` — expect no output.
Run: `npm run build` — expect success (font download happens at build; needs network).
Run: `npm start -- -p 3111 &`, open `http://localhost:3111/` — page renders paper-light, serif not yet applied to headings (later tasks), no unstyled/black-on-black text. Then kill the server.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx components/ThemeToggle.tsx
git commit -m "feat: editorial design tokens, Fraunces/Inter fonts, light-default theme"
```

---

### Task 2: Ingest — 4 months of data + weekly history

**Files:**
- Modify: `ingest/ingest.py`

**Interfaces:**
- Produces: `prices/{code}.json` new shape `{"rows": [[premise_code, price, prev|null, iso_date], ...], "hist": [[iso_week_start, min, med, max], ...]}`; `trends.json` rows gain `"spark": [med, ...]` (≤12 weekly medians, oldest→newest); `meta.json` gains `"historyWeeks": 12`. Current/previous window math unchanged.

- [ ] **Step 1: Add constants.** In `ingest/ingest.py`, below `PREVIOUS_DAYS = 14` add:

```python
# Weekly national history for sparklines / trend charts.
HISTORY_WEEKS = 12
# Months of parquet to pull — must cover HISTORY_WEEKS plus the windows.
MONTHS = 4
```

- [ ] **Step 2: Replace `find_fact_urls` with a multi-month walk:**

```python
def find_fact_urls(today: date, months: int = MONTHS) -> list[str]:
    """Latest available monthly file plus up to `months - 1` before it (the
    current month's file may not exist yet early in the month)."""
    y, m = today.year, today.month
    if not url_exists(f"{BASE}/pricecatcher_{month_str(y, m)}.parquet"):
        y, m = prev_month(y, m)
        if not url_exists(f"{BASE}/pricecatcher_{month_str(y, m)}.parquet"):
            sys.exit(f"No PriceCatcher file found for {today} or the month before.")
    urls = []
    for _ in range(months):
        url = f"{BASE}/pricecatcher_{month_str(y, m)}.parquet"
        if not url_exists(url):
            break
        urls.append(url)
        y, m = prev_month(y, m)
    return urls
```

- [ ] **Step 3: Compute weekly aggregates.** In `run()`, directly after the outlier-filter block (after the `print(f"outlier filter: ...")` line) and before the `cur` table, add:

```python
    # Weekly national aggregates for the last HISTORY_WEEKS weeks —
    # feeds item-page trend charts and home-board sparklines.
    con.execute(f"""
        CREATE TABLE weekly AS
        SELECT item_code, date_trunc('week', date) AS wk,
               min(price) AS mn, median(price) AS med, max(price) AS mx
        FROM fact
        WHERE date > DATE '{latest}' - INTERVAL {HISTORY_WEEKS * 7} DAY
        GROUP BY 1, 2 ORDER BY 1, 2
    """)
    hist_by_item: dict[int, list] = {}
    for code, wk, mn, med, mx in con.execute("SELECT * FROM weekly").fetchall():
        hist_by_item.setdefault(code, []).append(
            [wk.isoformat(), round(mn, 2), round(med, 2), round(mx, 2)])
    print(f"weekly history: {len(hist_by_item)} items")
```

(DuckDB returns `date_trunc('week', DATE)` as `datetime.date`, so `wk.isoformat()` is a plain `YYYY-MM-DD` Monday.)

- [ ] **Step 4: Change the per-item shard write.** Replace:

```python
    for item_code, item_rows in by_item.items():
        (prices_dir / f"{item_code}.json").write_text(
            json.dumps(item_rows, separators=(",", ":")))
```

with:

```python
    for item_code, item_rows in by_item.items():
        (prices_dir / f"{item_code}.json").write_text(
            json.dumps(
                {"rows": item_rows, "hist": hist_by_item.get(item_code, [])},
                separators=(",", ":")))
```

- [ ] **Step 5: Add spark to trends.** In the `trend_rows.append({...})` dict, add after `"pct": pct,`:

```python
            "spark": [h[2] for h in hist_by_item.get(code, [])],
```

- [ ] **Step 6: Add historyWeeks to meta.** In the `dump("meta.json", {...})` call, add after `"previousWindowDays": PREVIOUS_DAYS,`:

```python
        "historyWeeks": HISTORY_WEEKS,
```

- [ ] **Step 7: Run the ingest (network + a few minutes):**

Run: `.venv/bin/python ingest/ingest.py`
Expected: prints 3–4 fact files, outlier-filter line, `weekly history: N items`, writes files.

- [ ] **Step 8: Verify shapes:**

```bash
python3 - <<'EOF'
import json, glob
f = json.load(open(sorted(glob.glob("public/data/prices/*.json"))[0]))
assert set(f) == {"rows", "hist"} and isinstance(f["rows"], list), f.keys()
assert all(len(w) == 4 for w in f["hist"]), f["hist"][:2]
t = json.load(open("public/data/trends.json"))
assert "spark" in t[0] and len(t[0]["spark"]) <= 12, t[0]
m = json.load(open("public/data/meta.json"))
assert m["historyWeeks"] == 12
print("shapes ok:", len(f["hist"]), "weeks;", len(t), "trends")
EOF
```

Expected: `shapes ok: ...`

- [ ] **Step 9: Commit** (data regeneration included — these files are script-generated, not hand-edited):

```bash
git add ingest/ingest.py public/data
git commit -m "feat: ingest 4 months, emit weekly history (hist/spark) for charts"
```

---

### Task 3: build-shop-index handles both shard shapes

**Files:**
- Modify: `scripts/build-shop-index.mjs:30-31`

**Interfaces:**
- Consumes: `prices/{code}.json` in either shape (bare array or `{rows, hist}`).
- Produces: unchanged `shops/{code}.json` + `shops-index.json`.

- [ ] **Step 1: Edit the shard read.** Replace:

```js
  const rows = JSON.parse(readFileSync(join(PRICES, file), "utf8"));
```

with:

```js
  const parsed = JSON.parse(readFileSync(join(PRICES, file), "utf8"));
  // shards are {rows, hist} since the history ingest; old shape was a bare array
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
```

- [ ] **Step 2: Verify:**

Run: `npm run shops`
Expected: `build-shop-index: N shop files, N indexed` with N in the thousands (same as a pre-change run).

- [ ] **Step 3: Commit**

```bash
git add scripts/build-shop-index.mjs public/data/shops public/data/shops-index.json
git commit -m "fix: shop index reads new {rows,hist} price shards"
```

---

### Task 4: Frontend data shapes — types + useData + consumers

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/useData.tsx:32-59`
- Modify: `components/ItemClient.tsx` (minimal — `usePrices` consumer)
- Modify: `components/BasketClient.tsx:46-56` (minimal — `loadPrices` consumer)

**Interfaces:**
- Produces: `type HistWeek = [string, number, number, number]`; `interface PriceFile { rows: PriceRow[]; hist: HistWeek[] }`; `Trend.spark?: number[]`; `Meta.historyWeeks?: number`; `loadPrices(code): Promise<PriceFile>`; `usePrices(code): PriceFile | null`. Old-shape shards normalize to `{rows, hist: []}`.

- [ ] **Step 1: `lib/types.ts` additions.** After the `PriceRow` type add:

```ts
/** [iso_week_start(Mon), min, med, max] — weekly national aggregates */
export type HistWeek = [string, number, number, number];

/** Shape of prices/{item_code}.json since the history ingest. */
export interface PriceFile {
  rows: PriceRow[];
  hist: HistWeek[];
}
```

In `interface Trend` add after `pct`:

```ts
  /** last ≤12 weekly national medians, oldest→newest (may be absent in old data) */
  spark?: number[];
```

In `interface Meta` add after `previousWindowDays`:

```ts
  historyWeeks?: number;
```

- [ ] **Step 2: `lib/useData.tsx` — per-item prices section.** Replace the whole `// ---- per-item prices ----` section with:

```ts
// ---- per-item prices ----

const priceCache = new Map<number, PriceFile>();

export function loadPrices(itemCode: number): Promise<PriceFile> {
  const cached = priceCache.get(itemCode);
  if (cached) return Promise.resolve(cached);
  return fetch(`/data/prices/${itemCode}.json`)
    .then((r) => (r.ok ? r.json() : []))
    .then((raw: PriceRow[] | PriceFile) => {
      // old-shape shards are a bare rows array; normalize
      const file: PriceFile = Array.isArray(raw)
        ? { rows: raw, hist: [] }
        : raw;
      priceCache.set(itemCode, file);
      return file;
    });
}

export function usePrices(itemCode: number): PriceFile | null {
  const [file, setFile] = useState<PriceFile | null>(
    priceCache.get(itemCode) ?? null
  );
  useEffect(() => {
    let live = true;
    loadPrices(itemCode).then((f) => live && setFile(f));
    return () => {
      live = false;
    };
  }, [itemCode]);
  return file;
}
```

Update the type import at the top to include `HistWeek` is not needed here; add `PriceFile`:

```ts
import type { Premise, PriceFile, PriceRow, ShopPriceRow, ShopStat } from "./types";
```

- [ ] **Step 3: `components/ItemClient.tsx` consumer fix (keeps compiling; full restyle is Task 8).** Replace:

```ts
  const rows = usePrices(item.code);
```

with:

```ts
  const file = usePrices(item.code);
  const rows = file ? file.rows : null;
```

- [ ] **Step 4: `components/BasketClient.tsx` consumer fix.** In the `useEffect` that fills `priceMap`, replace:

```ts
      basket.codes.map((c) => loadPrices(c).then((rows) => [c, rows] as const))
```

with:

```ts
      basket.codes.map((c) => loadPrices(c).then((f) => [c, f.rows] as const))
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` — expect no output.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/useData.tsx components/ItemClient.tsx components/BasketClient.tsx
git commit -m "feat: PriceFile {rows,hist} shape with old-shape normalization"
```

---

### Task 5: Chart components — Sparkline + TrendChart

**Files:**
- Create: `components/Sparkline.tsx`
- Create: `components/TrendChart.tsx`
- Modify: `lib/i18n.tsx` (2 new keys)

**Interfaces:**
- Consumes: `HistWeek` from `lib/types`, `rm` from `lib/format`, `useLang`/`Lang` from `lib/i18n`.
- Produces: `<Sparkline data={number[]} pct={number|null} />` (64×20 inline SVG, aria-hidden, renders an empty spacer if <2 points); `<TrendChart hist={HistWeek[]} />` (responsive SVG, median line + min–max band, crosshair + tooltip, keyboard arrows; renders null if <2 weeks).
- Chart specs follow the dataviz skill: 2px line, ≥8px end marker with 2px surface ring, band as ~8% wash, hairline recessive gridlines, no legend (single series), crosshair tooltip on the full chart, text in text tokens never data colors.

- [ ] **Step 1: i18n keys.** In `lib/i18n.tsx` add to `STRINGS.ms` (before the closing `}` of `ms`):

```ts
    trendTitle: "Arah harga mingguan",
    trendNote:
      "Penengah kebangsaan mingguan · jalur = julat termurah–tertinggi",
```

and the same keys to `STRINGS.en`:

```ts
    trendTitle: "Weekly price trend",
    trendNote: "Weekly national median · band = cheapest–highest range",
```

- [ ] **Step 2: Create `components/Sparkline.tsx`:**

```tsx
// 12-week inline sparkline for board rows. Decorative (aria-hidden):
// the row's price + pct carry the accessible values.
export default function Sparkline({
  data,
  pct,
}: {
  data: number[];
  pct: number | null;
}) {
  const W = 64;
  const H = 20;
  if (!data || data.length < 2)
    return <span className="inline-block w-16 shrink-0" aria-hidden="true" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const px = (i: number) => 3 + (i / (data.length - 1)) * (W - 8);
  const py = (v: number) => H - 4 - ((v - min) / span) * (H - 8);
  const pts = data
    .map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`)
    .join(" ");
  const li = data.length - 1;
  const endCls =
    pct !== null && pct > 0.05
      ? "text-naik"
      : pct !== null && pct < -0.05
        ? "text-turun"
        : "text-faint";
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="shrink-0 w-16 h-5"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="var(--color-faint)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={px(li)}
        cy={py(data[li])}
        r="2.5"
        fill="currentColor"
        stroke="var(--color-bg)"
        strokeWidth="2"
        paintOrder="stroke"
        className={endCls}
      />
    </svg>
  );
}
```

- [ ] **Step 3: Create `components/TrendChart.tsx`:**

```tsx
"use client";

// Item-page weekly trend: national median line over a min–max band.
// Single series → no legend; crosshair + tooltip; ← → keys walk weeks.

import { useMemo, useState } from "react";
import type { HistWeek } from "@/lib/types";
import { useLang, type Lang } from "@/lib/i18n";
import { rm } from "@/lib/format";

const W = 640;
const H = 190;
const PAD = { t: 10, r: 14, b: 26, l: 48 };

function fmtWeek(iso: string, lang: Lang): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(
    lang === "ms" ? "ms-MY" : "en-MY",
    { day: "numeric", month: "short" }
  );
}

export default function TrendChart({ hist }: { hist: HistWeek[] }) {
  const { t, lang } = useLang();
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    if (hist.length < 2) return null;
    const lo = Math.min(...hist.map((w) => w[1]));
    const hi = Math.max(...hist.map((w) => w[3]));
    const span = hi - lo || 1;
    const x = (i: number) =>
      PAD.l + (i / (hist.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) =>
      PAD.t + (1 - (v - lo) / span) * (H - PAD.t - PAD.b);
    const line = hist
      .map((w, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(w[2]).toFixed(1)}`)
      .join(" ");
    const band =
      hist
        .map(
          (w, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(w[3]).toFixed(1)}`
        )
        .join(" ") +
      [...hist]
        .reverse()
        .map(
          (w, i) =>
            `L${x(hist.length - 1 - i).toFixed(1)} ${y(w[1]).toFixed(1)}`
        )
        .join(" ") +
      "Z";
    return { lo, hi, x, y, line, band };
  }, [hist]);

  if (!geo) return null;
  const { lo, hi, x, y, line, band } = geo;
  const li = hist.length - 1;
  const mid = (lo + hi) / 2;

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((fx - PAD.l) / (W - PAD.l - PAD.r)) * li);
    setHover(Math.max(0, Math.min(li, i)));
  };
  const onKey = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowLeft") {
      setHover((h) => Math.max(0, (h ?? li) - 1));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setHover((h) => Math.min(li, (h ?? 0) + 1));
      e.preventDefault();
    } else if (e.key === "Escape") {
      setHover(null);
    }
  };

  const hovered = hover !== null ? hist[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block touch-none cursor-crosshair outline-none focus-visible:ring-1 focus-visible:ring-accent"
        role="img"
        aria-label={`${t("trendTitle")}: ${rm(hist[0][2])} → ${rm(hist[li][2])}`}
        tabIndex={0}
        onPointerMove={pick}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        {[lo, mid, hi].map((v) => (
          <g key={v}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-hairline)"
              strokeWidth="1"
            />
            <text
              x={PAD.l - 8}
              y={y(v) + 3.5}
              textAnchor="end"
              className="fill-faint font-mono"
              fontSize="10"
            >
              {rm(v)}
            </text>
          </g>
        ))}
        <path d={band} fill="var(--color-ink)" opacity="0.08" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={x(li)}
          cy={y(hist[li][2])}
          r="4"
          fill="var(--color-ink)"
          stroke="var(--color-bg)"
          strokeWidth="2"
          paintOrder="stroke"
        />
        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="var(--color-faint)"
              strokeWidth="1"
            />
            <circle
              cx={x(hover)}
              cy={y(hist[hover][2])}
              r="4"
              fill="var(--color-ink)"
              stroke="var(--color-bg)"
              strokeWidth="2"
              paintOrder="stroke"
            />
          </g>
        )}
        <text
          x={PAD.l}
          y={H - 8}
          className="fill-faint font-mono"
          fontSize="10"
        >
          {fmtWeek(hist[0][0], lang)}
        </text>
        <text
          x={W - PAD.r}
          y={H - 8}
          textAnchor="end"
          className="fill-faint font-mono"
          fontSize="10"
        >
          {fmtWeek(hist[li][0], lang)}
        </text>
      </svg>
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 bg-bg border border-hairline px-2.5 py-1.5 text-[11px]"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <div className="font-mono text-ink text-[13px]">{rm(hovered[2])}</div>
          <div className="text-dim whitespace-nowrap">
            {rm(hovered[1])}–{rm(hovered[3])} · {fmtWeek(hovered[0], lang)}
          </div>
        </div>
      )}
    </div>
  );
}
```

Note: `useLang` must export `Lang` type — it already does (`export type Lang`).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` — expect no output. (Components render nothing yet — wired in Tasks 7–8.)

- [ ] **Step 5: Commit**

```bash
git add components/Sparkline.tsx components/TrendChart.tsx lib/i18n.tsx
git commit -m "feat: Sparkline and TrendChart SVG components"
```

---

### Task 6: Chrome — masthead Header, colophon Footer, bourse Ticker

**Files:**
- Modify: `components/Header.tsx` (full replace)
- Modify: `components/Footer.tsx` (full replace)
- Modify: `components/Ticker.tsx` (classes only)
- Modify: `app/layout.tsx:36-40` (pass meta to Footer)
- Modify: `lib/i18n.tsx` (1 new key)

**Interfaces:**
- Consumes: `.kicker` class, `accent` token (Task 1); `periodLabel` from i18n.
- Produces: `Footer` props change to `{ meta: { currentWindowDays: number; previousWindowDays: number } }`.

- [ ] **Step 1: i18n key.** Add to `STRINGS.ms`:

```ts
    methodNote: "Tetingkap perbandingan",
```

and to `STRINGS.en`:

```ts
    methodNote: "Comparison window",
```

- [ ] **Step 2: Replace `components/Header.tsx` entirely with:**

```tsx
"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useBasket } from "@/lib/useData";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header({ latestDate }: { latestDate: string }) {
  const { lang, setLang, t } = useLang();
  const { codes } = useBasket();

  const navCls =
    "hover:text-accent whitespace-nowrap py-2 text-[11px] tracking-[0.14em] uppercase";

  return (
    <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur-sm border-b-2 border-ink">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        <Link
          href="/"
          className="shrink-0 leading-none font-display font-semibold text-[22px] tracking-tight"
        >
          HargaNaikKe
        </Link>
        <div className="hidden sm:block text-[11px] tracking-[0.14em] uppercase text-dim truncate">
          {t("asOf")} {latestDate}
        </div>
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link href="/banding" className={navCls}>
            {t("navBanding")}
          </Link>
          <Link href="/bakul" className={navCls}>
            {t("basketShort")}
            {codes.length > 0 && (
              <span className="text-accent"> {codes.length}</span>
            )}
          </Link>
          <button
            onClick={() => setLang(lang === "ms" ? "en" : "ms")}
            className="py-2 text-[11px] tracking-[0.14em] uppercase text-dim cursor-pointer"
            aria-label="Tukar bahasa / switch language"
          >
            <span className={lang === "ms" ? "text-ink" : ""}>BM</span>
            <span className="text-faint">/</span>
            <span className={lang === "en" ? "text-ink" : ""}>EN</span>
          </button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Replace `components/Footer.tsx` entirely with:**

```tsx
"use client";

import { useLang, periodLabel } from "@/lib/i18n";

export default function Footer({
  meta,
}: {
  meta: { currentWindowDays: number; previousWindowDays: number };
}) {
  const { t, lang } = useLang();
  return (
    <footer className="border-t-2 border-ink mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 text-[12px] text-dim space-y-2">
        <p className="font-display font-semibold text-ink text-base">
          HargaNaikKe
        </p>
        <p>
          {t("sourceNote")}{" "}
          <a
            href="https://data.gov.my/data-catalogue/pricecatcher"
            className="underline underline-offset-2 hover:text-accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            data.gov.my
          </a>
        </p>
        <p>
          {t("methodNote")}: {periodLabel(lang, meta)}.
        </p>
        <p className="text-faint">{t("cpiNote")}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Pass meta in `app/layout.tsx`.** Replace `<Footer />` with:

```tsx
          <Footer meta={meta} />
```

- [ ] **Step 5: Ticker classes.** In `components/Ticker.tsx`, replace the entry `<Link>` block with:

```tsx
      <Link
        key={m.code}
        href={`/item/${m.code}`}
        className="inline-flex items-baseline gap-2 px-4 shrink-0 hover:bg-panel"
      >
        <span className="text-[12px] text-dim">{titleCase(item.name)}</span>
        <span
          className={`text-[12px] font-mono ${up ? "text-naik" : "text-turun"}`}
        >
          {up ? "▲" : "▼"} {pctStr(m.pct!)}
        </span>
      </Link>
```

(only class changes: name gains `text-dim`, pct gains `font-mono`).

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit` — no output.

- [ ] **Step 7: Commit**

```bash
git add components/Header.tsx components/Footer.tsx components/Ticker.tsx app/layout.tsx lib/i18n.tsx
git commit -m "feat: masthead header, colophon footer, restyled ticker"
```

---

### Task 7: Home page — hero, search, sparkline boards, feature cards

**Files:**
- Modify: `components/HomeClient.tsx` (full replace)
- Modify: `lib/i18n.tsx` (6 new keys)

**Interfaces:**
- Consumes: `Sparkline` (Task 5), `Trend.spark` (Task 4), `.kicker`, tokens.
- Produces: nothing consumed later.

- [ ] **Step 1: i18n keys.** Add to `STRINGS.ms`:

```ts
    edition: "Edisi",
    heroTitle: "Harga naik ke, minggu ini?",
    featBakulDesc:
      "Senarai belanja anda, dikira — premis paling jimat untuk seluruh bakul.",
    featBandingDesc: "Dua kedai, barang demi barang — mana satu lebih jimat?",
    featKedaiDesc: "Cari mana-mana kedai dan lihat berapa jimat harganya.",
    open: "Buka",
```

and to `STRINGS.en`:

```ts
    edition: "Edition",
    heroTitle: "Are prices up this week?",
    featBakulDesc:
      "Your shopping list, priced — the cheapest premise for the whole basket.",
    featBandingDesc: "Two shops, item by item — which one saves more?",
    featKedaiDesc: "Search any shop and see how cheap it runs.",
    open: "Open",
```

- [ ] **Step 2: Replace `components/HomeClient.tsx` entirely with:**

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Item, Meta, Premise, ShopStat, Trend } from "@/lib/types";
import { useLang, periodLabel } from "@/lib/i18n";
import { searchItems, searchPremises } from "@/lib/search";
import { loadPremises, loadShopStats } from "@/lib/useData";
import { rm, pctStr, moveClass, moveArrow, titleCase } from "@/lib/format";
import Ticker from "@/components/Ticker";
import Sparkline from "@/components/Sparkline";

const BOARD_SIZE = 12;

export default function HomeClient({
  items,
  trends,
  meta,
}: {
  items: Item[];
  trends: Trend[];
  meta: Meta;
}) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // type-to-search on desktop; no surprise keyboard on touch devices
  useEffect(() => {
    if (matchMedia("(pointer: fine)").matches) searchRef.current?.focus();
  }, []);

  const itemByCode = useMemo(
    () => new Map(items.map((i) => [i.code, i])),
    [items]
  );
  const movers = useMemo(
    () =>
      trends
        .filter((tr) => tr.pct !== null && itemByCode.has(tr.code))
        .sort((a, b) => b.pct! - a.pct!),
    [trends, itemByCode]
  );
  const nUp = movers.filter((m) => m.pct! > 0.05).length;
  const nDown = movers.filter((m) => m.pct! < -0.05).length;
  const risers = movers.filter((m) => m.pct! > 0.05).slice(0, BOARD_SIZE);
  const fallers = movers
    .filter((m) => m.pct! < -0.05)
    .reverse()
    .slice(0, BOARD_SIZE);

  const results = useMemo(
    () => searchItems(items, query).slice(0, 30),
    [items, query]
  );

  // shop data loads lazily on first keystroke — not on every home visit
  const [premiseList, setPremiseList] = useState<Premise[] | null>(null);
  const [shopStats, setShopStats] = useState<Map<number, ShopStat> | null>(
    null
  );
  useEffect(() => {
    if (!query.trim() || premiseList) return;
    loadPremises().then((m) => setPremiseList([...m.values()]));
    loadShopStats().then(setShopStats);
  }, [query, premiseList]);

  const shopResults = useMemo(
    () => (premiseList ? searchPremises(premiseList, query).slice(0, 10) : []),
    [premiseList, query]
  );
  const trendByCode = useMemo(
    () => new Map(trends.map((tr) => [tr.code, tr])),
    [trends]
  );

  const focusSearch = () => {
    searchRef.current?.focus();
    searchRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <div>
      <Ticker movers={movers} itemByCode={itemByCode} />

      {/* masthead hero + search */}
      <section className="py-10 sm:py-16">
        <p className="kicker">
          {t("edition")} {meta.latestDate} · {items.length} {t("itemsTracked")}
        </p>
        <h1 className="font-display font-semibold text-4xl sm:text-6xl tracking-tight mt-3 max-w-[18ch]">
          {t("heroTitle")}
        </h1>
        <p className="text-dim mt-4 text-[15px]">
          {lang === "ms"
            ? `${nUp} barang naik, ${nDown} turun — ${periodLabel(lang, meta)}.`
            : `${nUp} items up, ${nDown} down — ${periodLabel(lang, meta)}.`}
        </p>

        <div className="mt-8">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-transparent border-0 border-b-2 border-ink pb-3 text-[16px] sm:text-xl outline-none focus:border-accent placeholder:text-faint"
          />
        </div>

        {query.trim() && (
          <div className="mt-2 border-b border-hairline">
            <div className="py-2 kicker">
              {results.length} {t("results")}
            </div>
            {results.length === 0 && shopResults.length === 0 && (
              <div className="py-4 text-dim text-[13px]">{t("noData")}</div>
            )}
            {results.map((item) => {
              const tr = trendByCode.get(item.code);
              return (
                <Link
                  key={item.code}
                  href={`/item/${item.code}`}
                  className="flex items-baseline gap-3 py-2.5 row-line last:border-b-0 hover:bg-panel group -mx-2 px-2"
                >
                  <span className="flex-1 min-w-0 truncate group-hover:text-accent">
                    {titleCase(item.name)}
                  </span>
                  <span className="text-faint text-[11px] shrink-0">
                    {item.unit}
                  </span>
                  {tr && (
                    <span className="w-20 text-right shrink-0 font-mono">
                      {rm(tr.med)}
                    </span>
                  )}
                  {tr && (
                    <span
                      className={`w-16 text-right text-[12px] shrink-0 font-mono ${moveClass(tr.pct)}`}
                    >
                      {tr.pct !== null
                        ? `${moveArrow(tr.pct)} ${pctStr(tr.pct)}`
                        : "—"}
                    </span>
                  )}
                </Link>
              );
            })}
            {shopResults.length > 0 && (
              <>
                <div className="py-2 kicker border-t border-hairline">
                  {t("shops")} · {shopResults.length}
                </div>
                {shopResults.map((p) => {
                  const stat = shopStats?.get(p.code);
                  return (
                    <Link
                      key={p.code}
                      href={`/kedai/${p.code}`}
                      className="flex items-baseline gap-3 py-2.5 row-line last:border-b-0 hover:bg-panel group -mx-2 px-2"
                    >
                      <span className="flex-1 min-w-0 truncate group-hover:text-accent">
                        {titleCase(p.name)}
                      </span>
                      <span className="text-dim text-[11px] shrink-0 max-w-[40%] truncate">
                        {titleCase(p.district)}, {p.state}
                      </span>
                      {stat && (
                        <span
                          className={`w-20 text-right text-[12px] shrink-0 font-mono ${
                            stat.score >= 60 ? "text-turun" : "text-dim"
                          }`}
                        >
                          {stat.score}% {t("cheapShort")}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        )}
      </section>

      {!query.trim() && (
        <>
          {/* barang naik board */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
            <Board title={t("top")} movers={risers} itemByCode={itemByCode} />
            <Board
              title={t("bottom")}
              movers={fallers}
              itemByCode={itemByCode}
            />
          </section>
          <p className="mt-4 text-[11px] text-faint">
            {t("boardSub")} · {periodLabel(lang, meta)} · {t("coverageNote")}
          </p>

          {/* feature cards */}
          <section className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <FeatureCard
              kicker={t("basket")}
              desc={t("featBakulDesc")}
              cta={t("open")}
              href="/bakul"
            />
            <FeatureCard
              kicker={t("compareShops")}
              desc={t("featBandingDesc")}
              cta={t("open")}
              href="/banding"
            />
            <FeatureCard
              kicker={t("shops")}
              desc={t("featKedaiDesc")}
              cta={t("search")}
              onClick={focusSearch}
            />
          </section>
        </>
      )}
    </div>
  );
}

function Board({
  title,
  movers,
  itemByCode,
}: {
  title: string;
  movers: Trend[];
  itemByCode: Map<number, Item>;
}) {
  return (
    <div>
      <h2 className="kicker border-b-2 border-ink pb-2">{title}</h2>
      {movers.map((m) => {
        const item = itemByCode.get(m.code)!;
        return (
          <Link
            key={m.code}
            href={`/item/${m.code}`}
            className="flex items-center gap-3 py-2.5 sm:py-2 row-line hover:bg-panel group -mx-2 px-2"
          >
            <span className="flex-1 min-w-0 truncate text-[13px] group-hover:text-accent">
              {titleCase(item.name)}
            </span>
            <Sparkline data={m.spark ?? []} pct={m.pct} />
            <span className="w-18 text-right text-[13px] font-mono">
              {rm(m.med)}
            </span>
            <span
              className={`w-16 text-right text-[13px] font-mono ${moveClass(m.pct)}`}
            >
              {moveArrow(m.pct)} {pctStr(m.pct!)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function FeatureCard({
  kicker,
  desc,
  cta,
  href,
  onClick,
}: {
  kicker: string;
  desc: string;
  cta: string;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    "block w-full text-left border-t-2 border-ink pt-4 group cursor-pointer";
  const inner = (
    <>
      <p className="kicker group-hover:text-accent">{kicker}</p>
      <p className="font-display text-lg mt-2 leading-snug">{desc}</p>
      <p className="mt-3 text-[13px] text-accent">{cta} →</p>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — no output.
Run: `npm run build && npm start -- -p 3111 &` — open `http://localhost:3111/`: serif hero question, computed answer line, underline search, boards show sparklines (committed data has `spark` after Task 2), three feature cards. Kill server.

- [ ] **Step 4: Commit**

```bash
git add components/HomeClient.tsx lib/i18n.tsx
git commit -m "feat: editorial home — hero question, sparkline boards, feature cards"
```

---

### Task 8: Item page — figures row, trend chart, table, share card

**Files:**
- Modify: `components/ItemClient.tsx` (full replace)
- Modify: `components/ShareBar.tsx:107` (button class only)
- Modify: `lib/shareCard.ts` (full replace)

**Interfaces:**
- Consumes: `usePrices → PriceFile` (Task 4), `TrendChart` (Task 5), `trendTitle`/`trendNote` keys (Task 5).
- Produces: `ScopedStats` export unchanged (ShareBar depends on it).

- [ ] **Step 1: Replace `components/ItemClient.tsx` entirely with:**

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Item, Meta, Premise, PriceRow, Trend } from "@/lib/types";
import { useLang, periodLabel } from "@/lib/i18n";
import { usePremises, usePrices, useBasket } from "@/lib/useData";
import { rm, pctStr, moveClass, moveArrow, titleCase } from "@/lib/format";
import LocationPicker, {
  matchesLocation,
  type LocationFilter,
} from "@/components/LocationPicker";
import ShareBar from "@/components/ShareBar";
import TrendChart from "@/components/TrendChart";

const PAGE = 25;

export interface ScopedStats {
  min: number;
  med: number;
  max: number;
  n: number;
  pct: number | null;
  cheapest: { premise: Premise; price: number } | null;
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default function ItemClient({
  item,
  trend,
  meta,
}: {
  item: Item;
  trend: Trend | null;
  meta: Meta;
}) {
  const { t, lang } = useLang();
  const premises = usePremises();
  const file = usePrices(item.code);
  const rows = file ? file.rows : null;
  const basket = useBasket();
  const [loc, setLoc] = useState<LocationFilter>({ state: "", district: "" });
  const [showAll, setShowAll] = useState(false);
  const [sortKey, setSortKey] = useState<"price" | "date">("price");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const setSort = (key: "price" | "date") => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
    setShowAll(false);
  };

  const scoped = useMemo(() => {
    if (!rows || !premises) return null;
    const out: Array<{ row: PriceRow; premise: Premise }> = [];
    for (const row of rows) {
      const premise = premises.get(row[0]);
      if (premise && matchesLocation(premise, loc)) out.push({ row, premise });
    }
    // rows are pre-sorted cheapest-first by ingestion
    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      const av = sortKey === "price" ? a.row[1] : a.row[3];
      const bv = sortKey === "price" ? b.row[1] : b.row[3];
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return out;
  }, [rows, premises, loc, sortKey, sortDir]);

  const stats: ScopedStats | null = useMemo(() => {
    if (!scoped || scoped.length === 0) return null;
    const prices = scoped.map((s) => s.row[1]).sort((a, b) => a - b);
    const both = scoped.filter((s) => s.row[2] !== null);
    let pct: number | null = null;
    if (both.length >= 5) {
      const curMed = median(both.map((s) => s.row[1]).sort((a, b) => a - b));
      const prevMed = median(
        both.map((s) => s.row[2]!).sort((a, b) => a - b)
      );
      if (prevMed > 0) pct = ((curMed - prevMed) / prevMed) * 100;
    }
    return {
      min: prices[0],
      med: median(prices),
      max: prices[prices.length - 1],
      n: prices.length,
      pct,
      cheapest: { premise: scoped[0].premise, price: scoped[0].row[1] },
    };
  }, [scoped]);

  const allPremises = useMemo(
    () => (premises ? [...premises.values()] : []),
    [premises]
  );
  const visible = showAll ? scoped : scoped?.slice(0, PAGE);

  return (
    <div className="pt-6">
      <Link href="/" className="kicker hover:text-accent">
        {t("backHome")}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="kicker">
            {titleCase(item.category)} · {item.unit} · {t("asOf")}{" "}
            {meta.latestDate}
          </p>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight mt-2">
            {titleCase(item.name)}
          </h1>
        </div>
        <button
          onClick={() =>
            basket.has(item.code)
              ? basket.remove(item.code)
              : basket.add(item.code)
          }
          className={`px-4 py-2.5 sm:py-2 text-[11px] tracking-[0.14em] uppercase cursor-pointer border ${
            basket.has(item.code)
              ? "border-ink bg-ink text-bg"
              : "border-ink text-ink hover:bg-panel"
          }`}
        >
          {basket.has(item.code) ? `✓ ${t("inBasket")}` : t("addToBasket")}
        </button>
      </div>

      {/* figures row */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6">
        <Stat
          label={t("cheapest")}
          value={stats ? rm(stats.min) : "—"}
          className="text-accent"
        />
        <Stat label={t("median")} value={stats ? rm(stats.med) : "—"} />
        <Stat label={t("highest")} value={stats ? rm(stats.max) : "—"} />
        <Stat
          label={t("vsPrev")}
          value={
            stats?.pct != null
              ? `${moveArrow(stats.pct)} ${pctStr(stats.pct)}`
              : "—"
          }
          className={stats ? moveClass(stats.pct) : undefined}
        />
      </div>
      <p className="text-faint text-[11px] mt-2">
        {t("vsPrev")}: {periodLabel(lang, meta)}
      </p>

      {/* range strip */}
      {stats && stats.max > stats.min && (
        <div className="mt-4 relative h-6">
          <div className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
          <RangeMark stats={stats} />
        </div>
      )}

      {/* weekly trend chart */}
      {file && file.hist.length >= 2 && (
        <section className="mt-10">
          <h2 className="kicker border-b-2 border-ink pb-2">
            {t("trendTitle")}
          </h2>
          <div className="mt-4">
            <TrendChart hist={file.hist} />
          </div>
          <p className="text-faint text-[11px] mt-2">{t("trendNote")}</p>
        </section>
      )}

      <div className="mt-10">
        <LocationPicker
          premises={allPremises}
          value={loc}
          onChange={(v) => {
            setLoc(v);
            setShowAll(false);
          }}
        />
      </div>

      {/* price table */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink pb-2">
          <span className="kicker">{t("priceSpread")}</span>
          <span className="kicker">
            {scoped?.length ?? "…"} {t("premises")}
          </span>
        </div>
        <div className="flex items-baseline gap-3 py-1.5 text-[10px] tracking-[0.14em] uppercase text-faint border-b border-hairline">
          <SortButton
            className="w-16"
            label={t("price")}
            active={sortKey === "price"}
            dir={sortDir}
            onClick={() => setSort("price")}
          />
          <span className="w-14 shrink-0">{t("change")}</span>
          <span className="flex-1 min-w-0">{t("premise")}</span>
          <span className="hidden sm:inline w-40 shrink-0">
            {t("district")}, {t("state")}
          </span>
          <SortButton
            className="hidden sm:inline w-20 justify-end"
            label={t("date")}
            active={sortKey === "date"}
            dir={sortDir}
            onClick={() => setSort("date")}
          />
        </div>
        {!visible && (
          <div className="py-6 text-dim text-[13px]">{t("loading")}</div>
        )}
        {visible && visible.length === 0 && (
          <div className="py-6 text-dim text-[13px]">{t("noData")}</div>
        )}
        {visible?.map(({ row, premise }, idx) => {
          const [, price, prev] = row;
          const pct =
            prev !== null && prev > 0 ? ((price - prev) / prev) * 100 : null;
          const isCheapest =
            idx === 0 && sortKey === "price" && sortDir === "asc";
          return (
            <div
              key={`${row[0]}`}
              className={`flex items-baseline gap-3 py-2 row-line text-[13px] -mx-2 px-2 ${
                isCheapest ? "bg-gold" : ""
              }`}
            >
              <span
                className={`w-16 shrink-0 font-mono ${
                  isCheapest ? "text-accent font-semibold" : ""
                }`}
              >
                {rm(price)}
              </span>
              <span
                className={`w-14 shrink-0 text-[11px] font-mono ${moveClass(pct)}`}
                title={prev !== null ? `${t("prevPrice")}: ${rm(prev)}` : ""}
              >
                {pct !== null ? `${moveArrow(pct)}${pctStr(pct)}` : "·"}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate">
                  {titleCase(premise.name)}
                </span>
                <span className="block sm:hidden truncate text-dim text-[11px]">
                  {premise.district}, {premise.state} ·{" "}
                  <span className="text-faint">{row[3]}</span>
                </span>
              </span>
              <span className="hidden sm:inline w-40 shrink-0 truncate text-dim text-[11px]">
                {premise.district}, {premise.state}
              </span>
              <span className="hidden sm:inline w-20 shrink-0 text-right text-faint text-[11px] font-mono">
                {row[3]}
              </span>
            </div>
          );
        })}
        {scoped && scoped.length > PAGE && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-[12px] text-dim hover:text-accent border-b border-hairline cursor-pointer text-left"
          >
            {showAll ? t("showLess") : `${t("showAll")} (${scoped.length})`}
          </button>
        )}
      </div>
      <p className="text-faint text-[11px] mt-2">{t("coverageNote")}</p>

      {stats && <ShareBar item={item} stats={stats} loc={loc} meta={meta} />}
    </div>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-0.5 shrink-0 cursor-pointer hover:text-accent ${
        active ? "text-accent" : ""
      } ${className ?? ""}`}
    >
      {label}
      {active && <span>{dir === "asc" ? "▲" : "▼"}</span>}
    </button>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="border-t-2 border-ink pt-3">
      <div className="kicker">{label}</div>
      <div
        className={`mt-1 font-display font-semibold text-2xl sm:text-3xl ${className ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function RangeMark({ stats }: { stats: ScopedStats }) {
  const pos = (v: number) =>
    `${((v - stats.min) / (stats.max - stats.min)) * 100}%`;
  return (
    <>
      <div
        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent"
        style={{ left: pos(stats.min) }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-ink"
        style={{ left: pos(stats.med) }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-faint"
        style={{ left: pos(stats.max), transform: "translate(-100%,-50%)" }}
      />
    </>
  );
}
```

- [ ] **Step 2: `components/ShareBar.tsx` button class.** Replace the `btn` constant with:

```ts
  const btn =
    "border border-hairline px-3 py-2.5 sm:py-1.5 text-[12px] text-dim hover:text-ink hover:border-ink cursor-pointer";
```

- [ ] **Step 3: Replace `lib/shareCard.ts` entirely with:**

```ts
// Client-side canvas renderer for the WhatsApp-shareable price card.
// 1080x1080, editorial paper styling — always light, theme-independent.

const BG = "#faf7f0";
const INK = "#1c1a17";
const DIM = "#6f6a5e";
const FAINT = "#a29b8a";
const ACCENT = "#23479c";
const NAIK = "#b23a24";
const TURUN = "#1e6b4f";
const HAIRLINE = "#e3ddcf";

// next/font registers hashed family names — read the real stacks off the CSS vars
function family(varName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}
const DISPLAY = (px: number, weight = 600) =>
  `${weight} ${px}px ${family("--font-fraunces", "Georgia, serif")}`;
const SANS = (px: number, weight = 400) =>
  `${weight} ${px}px ${family("--font-inter", "system-ui, sans-serif")}`;

export interface ItemCardSpec {
  lang: "ms" | "en";
  itemName: string;
  unit: string;
  scope: string;
  min: number;
  med: number;
  max: number;
  pct: number | null;
  cheapestName: string;
  cheapestPlace: string;
  date: string;
}

const rm = (v: number) => `RM${v.toFixed(2)}`;

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawItemCard(
  spec: ItemCardSpec
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const S = 1080;
  const M = 72; // margin
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, S, S);

  // masthead
  ctx.font = DISPLAY(44, 600);
  ctx.fillStyle = INK;
  ctx.fillText("HargaNaikKe", M, M + 36);

  ctx.font = SANS(26);
  ctx.fillStyle = DIM;
  const dateLabel = `${spec.date}`;
  ctx.fillText(dateLabel, S - M - ctx.measureText(dateLabel).width, M + 34);

  // thick editorial rule
  ctx.fillStyle = INK;
  ctx.fillRect(M, M + 62, S - 2 * M, 4);

  // item name (wrapped, serif)
  ctx.font = DISPLAY(56, 600);
  ctx.fillStyle = INK;
  const nameLines = wrap(ctx, spec.itemName, S - 2 * M).slice(0, 3);
  let y = M + 160;
  for (const line of nameLines) {
    ctx.fillText(line, M, y);
    y += 68;
  }
  ctx.font = SANS(30);
  ctx.fillStyle = DIM;
  ctx.fillText(`${spec.unit} · ${spec.scope}`, M, y + 4);
  y += 92;

  // big cheapest price
  ctx.font = SANS(26, 600);
  ctx.fillStyle = FAINT;
  ctx.fillText(spec.lang === "ms" ? "TERMURAH" : "CHEAPEST", M, y);
  y += 108;
  ctx.font = DISPLAY(124, 600);
  ctx.fillStyle = ACCENT;
  ctx.fillText(rm(spec.min), M, y);
  y += 58;

  ctx.font = SANS(30);
  ctx.fillStyle = INK;
  const cheapLines = wrap(ctx, spec.cheapestName, S - 2 * M).slice(0, 2);
  for (const line of cheapLines) {
    ctx.fillText(line, M, y);
    y += 40;
  }
  ctx.fillStyle = DIM;
  ctx.fillText(spec.cheapestPlace, M, y);
  y += 74;

  // median / highest / change row
  const cols = [
    [spec.lang === "ms" ? "PENENGAH" : "MEDIAN", rm(spec.med)],
    [spec.lang === "ms" ? "TERTINGGI" : "HIGHEST", rm(spec.max)],
  ] as const;
  let x = M;
  for (const [label, value] of cols) {
    ctx.font = SANS(24, 600);
    ctx.fillStyle = FAINT;
    ctx.fillText(label, x, y);
    ctx.font = DISPLAY(44, 600);
    ctx.fillStyle = INK;
    ctx.fillText(value, x, y + 56);
    x += 300;
  }
  if (spec.pct != null) {
    const up = spec.pct > 0.05;
    const flat = Math.abs(spec.pct) <= 0.05;
    ctx.font = SANS(24, 600);
    ctx.fillStyle = FAINT;
    ctx.fillText(spec.lang === "ms" ? "VS SEBELUM" : "VS PREVIOUS", x, y);
    ctx.font = DISPLAY(44, 600);
    ctx.fillStyle = flat ? DIM : up ? NAIK : TURUN;
    const sign = spec.pct > 0 ? "+" : "";
    ctx.fillText(
      `${flat ? "·" : up ? "▲" : "▼"} ${sign}${spec.pct.toFixed(1)}%`,
      x,
      y + 56
    );
  }

  // footer
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, S - M - 56);
  ctx.lineTo(S - M, S - M - 56);
  ctx.stroke();
  ctx.font = SANS(22);
  ctx.fillStyle = FAINT;
  ctx.fillText(
    spec.lang === "ms"
      ? "Sumber: PriceCatcher, KPDN & DOSM · data.gov.my · CC BY 4.0"
      : "Source: PriceCatcher, KPDN & DOSM · data.gov.my · CC BY 4.0",
    M,
    S - M - 16
  );

  return canvas;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` — no output.
Run: `npm run build && npm start -- -p 3111 &` — open `http://localhost:3111/item/1355`: serif title, figures row with thick top rules, trend chart with band + crosshair on hover, cheapest table row gold-tinted, share buttons present. Kill server.

- [ ] **Step 5: Commit**

```bash
git add components/ItemClient.tsx components/ShareBar.tsx lib/shareCard.ts
git commit -m "feat: editorial item page with weekly trend chart + paper share card"
```

---

### Task 9: Kedai (shop) page

**Files:**
- Modify: `components/ShopClient.tsx` (full replace)

**Interfaces:** none new.

- [ ] **Step 1: Replace `components/ShopClient.tsx` entirely with:**

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Item, Meta, Premise, ShopStat, Trend } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { useShopPrices } from "@/lib/useData";
import { rm, pctStr, titleCase } from "@/lib/format";

const PAGE = 25;

export default function ShopClient({
  premise,
  stat,
  items,
  trends,
  meta,
}: {
  premise: Premise;
  stat: ShopStat | null;
  items: Item[];
  trends: Trend[];
  meta: Meta;
}) {
  const { t } = useLang();
  const rows = useShopPrices(premise.code);
  const [showAll, setShowAll] = useState(false);

  const itemByCode = useMemo(
    () => new Map(items.map((i) => [i.code, i])),
    [items]
  );
  const medByCode = useMemo(
    () => new Map(trends.map((tr) => [tr.code, tr.med])),
    [trends]
  );

  const joined = useMemo(() => {
    if (!rows) return null;
    const out: Array<{
      item: Item;
      price: number;
      date: string;
      med: number | null;
      pct: number | null;
    }> = [];
    for (const [code, price, , date] of rows) {
      const item = itemByCode.get(code);
      if (!item) continue;
      const med = medByCode.get(code) ?? null;
      const pct = med && med > 0 ? ((price - med) / med) * 100 : null;
      out.push({ item, price, date, med, pct });
    }
    // best deals first; unrated rows sink to the bottom
    out.sort((a, b) => (a.pct ?? Infinity) - (b.pct ?? Infinity));
    return out;
  }, [rows, itemByCode, medByCode]);

  const visible = showAll ? joined : joined?.slice(0, PAGE);

  return (
    <div className="pt-6">
      <Link href="/" className="kicker hover:text-accent">
        {t("backHome")}
      </Link>

      <div className="mt-4">
        <p className="kicker">
          {titleCase(premise.district)}, {premise.state} · {premise.type}
        </p>
        <h1 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight mt-2">
          {titleCase(premise.name)}
        </h1>
        <p className="text-dim text-[12px] mt-2">
          {titleCase(premise.address)}
        </p>
      </div>

      {/* figures row */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
        <Stat
          label={t("cheapnessScore")}
          value={stat ? `${stat.score}%` : "—"}
          className={stat && stat.score >= 60 ? "text-turun" : undefined}
        />
        <Stat label={t("itemsAtShop")} value={stat ? String(stat.n) : "—"} />
        <Stat label={t("asOf")} value={meta.latestDate} />
      </div>
      <p className="text-faint text-[11px] mt-2">{t("scoreNote")}</p>

      <div className="mt-4">
        <Link
          href={`/banding?a=${premise.code}`}
          className="inline-block border border-ink px-4 py-2 text-[11px] tracking-[0.14em] uppercase hover:bg-panel"
        >
          {t("compareThisShop")} →
        </Link>
      </div>

      {/* price table */}
      <div className="mt-10">
        <div className="flex justify-between border-b-2 border-ink pb-2">
          <span className="kicker">{t("price")}</span>
          <span className="kicker">{t("vsMedian")}</span>
        </div>
        {!visible && (
          <div className="py-6 text-dim text-[13px]">{t("loading")}</div>
        )}
        {visible && visible.length === 0 && (
          <div className="py-6 text-dim text-[13px]">{t("noData")}</div>
        )}
        {visible?.map(({ item, price, date, pct }) => (
          <Link
            key={item.code}
            href={`/item/${item.code}`}
            className="flex items-baseline gap-3 py-2 row-line text-[13px] hover:bg-panel group -mx-2 px-2"
          >
            <span className="flex-1 min-w-0">
              <span className="block truncate group-hover:text-accent">
                {titleCase(item.name)}
              </span>
              <span className="block sm:hidden truncate text-dim text-[11px]">
                {item.unit} · <span className="text-faint">{date}</span>
              </span>
            </span>
            <span className="hidden sm:inline w-24 shrink-0 truncate text-faint text-[11px]">
              {item.unit}
            </span>
            <span className="w-18 text-right shrink-0 font-mono">
              {rm(price)}
            </span>
            <span className="w-24 text-right shrink-0 text-[12px] font-mono">
              {pct === null ? (
                <span className="text-dim">—</span>
              ) : pct <= -5 ? (
                <span className="text-turun">
                  {t("cheapHere")} {pctStr(pct)}
                </span>
              ) : pct >= 5 ? (
                <span className="text-naik">
                  {t("expensiveHere")} {pctStr(pct)}
                </span>
              ) : (
                <span className="text-dim">{pctStr(pct)}</span>
              )}
            </span>
          </Link>
        ))}
        {joined && joined.length > PAGE && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-[12px] text-dim hover:text-accent border-b border-hairline cursor-pointer text-left"
          >
            {showAll ? t("showLess") : `${t("showAll")} (${joined.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="border-t-2 border-ink pt-3">
      <div className="kicker">{label}</div>
      <div
        className={`mt-1 font-display font-semibold text-2xl sm:text-3xl ${className ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — no output.

- [ ] **Step 3: Commit**

```bash
git add components/ShopClient.tsx
git commit -m "feat: editorial kedai page"
```

---

### Task 10: Bakul page + pickers

**Files:**
- Modify: `components/BasketClient.tsx` (full replace)
- Modify: `components/ShopPicker.tsx` (classes)
- Modify: `components/LocationPicker.tsx:42` (classes)

**Interfaces:** none new. All basket/ranking/my-shop logic identical.

- [ ] **Step 1: Replace `components/BasketClient.tsx` entirely with:**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Item, Meta, Premise, PriceRow } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { loadPrices, useBasket, usePremises } from "@/lib/useData";
import { rm, titleCase } from "@/lib/format";
import { searchItems } from "@/lib/search";
import LocationPicker, {
  matchesLocation,
  type LocationFilter,
} from "@/components/LocationPicker";
import ShopPicker from "@/components/ShopPicker";

interface PremiseTotal {
  premise: Premise;
  total: number;
  found: number; // how many basket items this premise stocks
  prices: Map<number, number>; // item_code -> price
}

export default function BasketClient({
  items,
  meta,
}: {
  items: Item[];
  meta: Meta;
}) {
  const { lang, t } = useLang();
  const basket = useBasket();
  const premises = usePremises();
  const [loc, setLoc] = useState<LocationFilter>({ state: "", district: "" });
  const [priceMap, setPriceMap] = useState<Map<number, PriceRow[]>>(new Map());
  const [query, setQuery] = useState("");
  const [myShop, setMyShop] = useState<Premise | null>(null);

  const itemByCode = useMemo(
    () => new Map(items.map((i) => [i.code, i])),
    [items]
  );
  const basketItems = basket.codes
    .map((c) => itemByCode.get(c))
    .filter((i): i is Item => !!i);

  useEffect(() => {
    let live = true;
    Promise.all(
      basket.codes.map((c) => loadPrices(c).then((f) => [c, f.rows] as const))
    ).then((entries) => {
      if (live) setPriceMap(new Map(entries));
    });
    return () => {
      live = false;
    };
  }, [basket.codes]);

  const ranking: PremiseTotal[] | null = useMemo(() => {
    if (!premises || basket.codes.length === 0) return null;
    if (basket.codes.some((c) => !priceMap.has(c))) return null;

    const byPremise = new Map<number, PremiseTotal>();
    for (const code of basket.codes) {
      for (const [premiseCode, price] of priceMap.get(code)!) {
        const premise = premises.get(premiseCode);
        if (!premise || !matchesLocation(premise, loc)) continue;
        let entry = byPremise.get(premiseCode);
        if (!entry) {
          entry = { premise, total: 0, found: 0, prices: new Map() };
          byPremise.set(premiseCode, entry);
        }
        entry.total += price;
        entry.found += 1;
        entry.prices.set(code, price);
      }
    }
    // full-coverage premises first (cheapest total), then partial by coverage
    return [...byPremise.values()].sort(
      (a, b) => b.found - a.found || a.total - b.total
    );
  }, [premises, basket.codes, priceMap, loc]);

  // deliberately unfiltered by location so any picked shop resolves
  const mine = useMemo(() => {
    if (!myShop || basket.codes.length === 0) return null;
    if (basket.codes.some((c) => !priceMap.has(c))) return null;
    let total = 0;
    const prices = new Map<number, number>();
    for (const code of basket.codes) {
      const row = priceMap.get(code)!.find((r) => r[0] === myShop.code);
      if (row) {
        total += row[1];
        prices.set(code, row[1]);
      }
    }
    return { total, found: prices.size, prices };
  }, [myShop, basket.codes, priceMap]);

  const full = ranking?.filter((r) => r.found === basket.codes.length) ?? [];
  const winner = full[0] ?? null;
  const results = useMemo(
    () => searchItems(items, query).slice(0, 8),
    [items, query]
  );
  const allPremises = useMemo(
    () => (premises ? [...premises.values()] : []),
    [premises]
  );

  const shareText = () => {
    if (!winner) return "";
    const lines = basketItems.map((i) => {
      const p = winner.prices.get(i.code);
      return `· ${titleCase(i.name)}: ${p != null ? rm(p) : "—"}`;
    });
    const head =
      lang === "ms"
        ? `*Bakul Saya* — ${basketItems.length} barang\n🏆 Paling jimat: ${titleCase(winner.premise.name)} (${winner.premise.district}, ${winner.premise.state})\n💰 Jumlah: ${rm(winner.total)}`
        : `*My Basket* — ${basketItems.length} items\n🏆 Cheapest: ${titleCase(winner.premise.name)} (${winner.premise.district}, ${winner.premise.state})\n💰 Total: ${rm(winner.total)}`;
    const tail =
      lang === "ms"
        ? `Data ${meta.latestDate} · harganaik · Sumber: PriceCatcher KPDN/DOSM (CC BY 4.0)`
        : `Data ${meta.latestDate} · harganaik · Source: PriceCatcher KPDN/DOSM (CC BY 4.0)`;
    return [head, ...lines, "", tail].join("\n");
  };

  return (
    <div className="pt-6">
      <Link href="/" className="kicker hover:text-accent">
        {t("backHome")}
      </Link>
      <h1 className="mt-4 font-display font-semibold text-3xl sm:text-4xl tracking-tight">
        {t("basket")}
      </h1>

      {/* add items */}
      <div className="mt-6 relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full bg-transparent border-0 border-b-2 border-ink pb-2 text-[16px] sm:text-[15px] outline-none focus:border-accent placeholder:text-faint"
        />
        {query.trim() && results.length > 0 && (
          <div className="absolute z-10 left-0 right-0 top-full bg-bg border border-hairline max-h-72 overflow-y-auto">
            {results.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  basket.add(item.code);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-2.5 sm:py-2 row-line last:border-b-0 text-[13px] hover:bg-panel hover:text-accent cursor-pointer flex justify-between gap-3"
              >
                <span className="truncate">{titleCase(item.name)}</span>
                <span className="text-faint text-[11px] shrink-0">
                  {basket.has(item.code) ? `✓ ${t("inBasket")}` : item.unit}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {basketItems.length === 0 ? (
        <p className="mt-8 text-dim text-[13px]">{t("emptyBasket")}</p>
      ) : (
        <>
          {/* basket contents */}
          <div className="mt-6">
            {basketItems.map((item) => (
              <div
                key={item.code}
                className="flex items-baseline gap-3 py-2 row-line text-[13px]"
              >
                <Link
                  href={`/item/${item.code}`}
                  className="flex-1 min-w-0 truncate hover:text-accent"
                >
                  {titleCase(item.name)}
                </Link>
                <span className="text-faint text-[11px]">{item.unit}</span>
                {winner && (
                  <span className="w-20 text-right font-mono">
                    {winner.prices.has(item.code)
                      ? rm(winner.prices.get(item.code)!)
                      : "—"}
                  </span>
                )}
                <button
                  onClick={() => basket.remove(item.code)}
                  className="text-faint hover:text-naik text-[11px] cursor-pointer px-2 py-1.5 -my-1.5 -mr-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <LocationPicker
              premises={allPremises}
              value={loc}
              onChange={setLoc}
            />
          </div>

          {/* winner */}
          {!ranking && (
            <p className="mt-6 text-dim text-[13px]">{t("loading")}</p>
          )}
          {ranking && winner && (
            <div className="mt-8 border-t-2 border-ink pt-4">
              <div className="kicker">{t("basketCheapest")}</div>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="font-display font-semibold text-2xl">
                    {titleCase(winner.premise.name)}
                  </div>
                  <div className="text-dim text-[12px]">
                    {winner.premise.district}, {winner.premise.state} ·{" "}
                    {winner.premise.type}
                  </div>
                </div>
                <div className="font-display font-semibold text-4xl text-accent">
                  {rm(winner.total)}
                </div>
              </div>
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(shareText())}`,
                    "_blank",
                    "noopener"
                  )
                }
                className="mt-4 border border-hairline px-3 py-2.5 sm:py-1.5 text-[12px] text-dim hover:text-ink hover:border-ink cursor-pointer"
              >
                {t("shareWhatsApp")}
              </button>
            </div>
          )}
          {ranking && !winner && ranking.length > 0 && (
            <p className="mt-6 text-dim text-[13px]">
              {lang === "ms"
                ? "Tiada satu premis dengan semua barang di kawasan ini — premis terbaik di bawah."
                : "No single premise stocks the whole basket here — best options below."}
            </p>
          )}
          {ranking && ranking.length === 0 && (
            <p className="mt-6 text-dim text-[13px]">{t("noData")}</p>
          )}

          {/* my shop */}
          <div className="mt-8">
            <div className="kicker border-b-2 border-ink pb-2 mb-3">
              {t("atThisShop")}
            </div>
            <ShopPicker
              premises={allPremises}
              value={myShop}
              onChange={setMyShop}
            />
            {myShop && !mine && (
              <p className="mt-3 text-dim text-[13px]">{t("loading")}</p>
            )}
            {myShop && mine && mine.found === 0 && (
              <p className="mt-3 text-dim text-[13px]">{t("noData")}</p>
            )}
            {myShop && mine && mine.found > 0 && (
              <div className="mt-3 border border-hairline p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-dim text-[12px]">
                    {mine.found}/{basket.codes.length} {t("coverage")}
                  </div>
                  <div className="font-display font-semibold text-2xl">
                    {rm(mine.total)}
                  </div>
                </div>
                {winner && mine.found === basket.codes.length && (
                  <div
                    className={`mt-1 text-right text-[12px] font-mono ${
                      mine.total > winner.total ? "text-naik" : "text-turun"
                    }`}
                  >
                    {mine.total > winner.total
                      ? `+${rm(mine.total - winner.total)} ${t("moreThanCheapest")}`
                      : `= ${t("cheapest")}`}
                  </div>
                )}
                {mine.found < basket.codes.length && (
                  <div className="mt-2 text-[11px] text-dim">
                    {t("missingHere")}:{" "}
                    {basketItems
                      .filter((i) => !mine.prices.has(i.code))
                      .map((i) => titleCase(i.name))
                      .join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ranking table */}
          {ranking && ranking.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between border-b-2 border-ink pb-2">
                <span className="kicker">{t("basketTotal")}</span>
                <span className="kicker">
                  {ranking.length} {t("premises")}
                </span>
              </div>
              {ranking.slice(0, 20).map((r) => (
                <div
                  key={r.premise.code}
                  className={`flex items-baseline gap-3 py-2 row-line text-[13px] -mx-2 px-2 ${
                    r === winner ? "bg-gold" : ""
                  }`}
                >
                  <span
                    className={`w-20 shrink-0 font-mono ${
                      r === winner ? "text-accent font-semibold" : ""
                    }`}
                  >
                    {rm(r.total)}
                  </span>
                  <span className="w-14 shrink-0 text-[11px] text-dim font-mono">
                    {r.found}/{basket.codes.length}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">
                      {titleCase(r.premise.name)}
                    </span>
                    <span className="block sm:hidden truncate text-dim text-[11px]">
                      {r.premise.district}, {r.premise.state}
                    </span>
                  </span>
                  <span className="hidden sm:inline w-40 shrink-0 truncate text-dim text-[11px]">
                    {r.premise.district}, {r.premise.state}
                  </span>
                </div>
              ))}
              <div className="py-2 text-[10px] text-faint border-t border-hairline">
                n/{basket.codes.length} = {t("coverage")}
              </div>
            </div>
          )}
          <p className="mt-3 text-faint text-[11px]">{t("coverageNote")}</p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `components/ShopPicker.tsx` classes.** Remove the `>` prompt span entirely (the `<span className="absolute left-3 ...">&gt;</span>` element), then change the input `className` to:

```
"w-full bg-panel border border-hairline px-3 py-2.5 text-[16px] sm:text-[13px] outline-none focus:border-accent placeholder:text-faint"
```

and in the results dropdown button change `hover:text-acid` → `hover:text-accent`. In the selected-value view no changes needed.

- [ ] **Step 3: `components/LocationPicker.tsx` select class.** Replace the `cls` constant with:

```ts
  const cls =
    "bg-panel border border-hairline px-3 py-2 pr-7 text-[16px] sm:text-[13px] outline-none focus:border-accent text-ink w-full cursor-pointer";
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` — no output.

- [ ] **Step 5: Commit**

```bash
git add components/BasketClient.tsx components/ShopPicker.tsx components/LocationPicker.tsx
git commit -m "feat: editorial bakul page + picker restyle"
```

---

### Task 11: Banding (compare) page

**Files:**
- Modify: `components/CompareClient.tsx` (presentation only)

**Interfaces:** none new. Deep-link/URL-sync/table logic identical.

- [ ] **Step 1: Edit `components/CompareClient.tsx` return block.** Replace the JSX `return (...)` (everything from `return (` to the end of the component function) with:

```tsx
  return (
    <div className="pt-6">
      <Link href="/" className="kicker hover:text-accent">
        {t("backHome")}
      </Link>
      <h1 className="mt-4 font-display font-semibold text-3xl sm:text-4xl tracking-tight">
        {t("compareShops")}
      </h1>
      <p className="text-faint mt-2 text-[11px]">
        {t("asOf")} {meta.latestDate}
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { value: a, onChange: setA },
          { value: b, onChange: setB },
        ].map((side, i) => (
          <div key={i}>
            <ShopPicker
              premises={allPremises}
              value={side.value}
              onChange={side.onChange}
            />
            {side.value && (
              <div className="mt-1 text-[11px] text-dim px-1">
                {side.value.district}, {side.value.state} · {side.value.type}
                {stats?.get(side.value.code) && (
                  <span>
                    {" "}
                    · {stats.get(side.value.code)!.score}% {t("cheapShort")}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {a && b && !table && (
        <p className="mt-6 text-dim text-[13px]">{t("loading")}</p>
      )}

      {a && b && table && (
        <div className="mt-8">
          <div className="flex items-baseline gap-3 pb-2 border-b-2 border-ink">
            <span className="flex-1 min-w-0 kicker">{t("item")}</span>
            <span className="w-20 text-right truncate kicker">
              {titleCase(a.name).split(" ")[0]}
            </span>
            <span className="w-20 text-right truncate kicker">
              {titleCase(b.name).split(" ")[0]}
            </span>
          </div>
          {table.rows.length === 0 && (
            <div className="py-6 text-dim text-[13px]">{t("noData")}</div>
          )}
          {table.rows.map(({ item, pa, pb }) => {
            const aWins = pa !== null && pb !== null && pa < pb;
            const bWins = pa !== null && pb !== null && pb < pa;
            return (
              <Link
                key={item.code}
                href={`/item/${item.code}`}
                className="flex items-baseline gap-3 py-2 row-line text-[13px] hover:bg-panel group -mx-2 px-2"
              >
                <span className="flex-1 min-w-0 truncate group-hover:text-accent">
                  {titleCase(item.name)}
                </span>
                <span
                  className={`w-20 text-right shrink-0 font-mono ${
                    aWins
                      ? "text-turun font-semibold"
                      : pa === null
                        ? "text-faint"
                        : ""
                  }`}
                >
                  {pa !== null ? rm(pa) : "—"}
                </span>
                <span
                  className={`w-20 text-right shrink-0 font-mono ${
                    bWins
                      ? "text-turun font-semibold"
                      : pb === null
                        ? "text-faint"
                        : ""
                  }`}
                >
                  {pb !== null ? rm(pb) : "—"}
                </span>
              </Link>
            );
          })}
          {table.common > 0 && (
            <div className="flex items-baseline gap-3 py-3 border-t-2 border-ink text-[13px] font-semibold">
              <span className="flex-1 min-w-0 truncate">
                {t("commonItemsTotal")}{" "}
                <span className="text-dim font-normal text-[11px]">
                  ({table.common} {t("item").toLowerCase()})
                </span>
              </span>
              <span
                className={`w-20 text-right shrink-0 font-mono text-[15px] ${
                  table.totalA < table.totalB ? "text-turun" : ""
                }`}
              >
                {rm(table.totalA)}
              </span>
              <span
                className={`w-20 text-right shrink-0 font-mono text-[15px] ${
                  table.totalB < table.totalA ? "text-turun" : ""
                }`}
              >
                {rm(table.totalB)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — no output.

- [ ] **Step 3: Commit**

```bash
git add components/CompareClient.tsx
git commit -m "feat: editorial banding page"
```

---

### Task 12: Cleanup, docs, full verification

**Files:**
- Modify: `app/globals.css` (remove acid alias)
- Modify: `CLAUDE.md` (styling section)

- [ ] **Step 1: Confirm no `acid` usage remains:**

Run: `grep -rn "acid" app components lib --include="*.tsx" --include="*.ts" --include="*.css"`
Expected: only the two `--color-acid` alias lines in `app/globals.css`. If any component still references `text-acid`/`border-acid`/`bg-acid`, replace with the `accent` equivalent first.

- [ ] **Step 2: Remove the alias.** Delete from `app/globals.css`:

```css
  /* legacy alias for the old terminal accent — removed in cleanup */
  --color-acid: #23479c;
```

and (in the dark block):

```css
  --color-acid: #93a9e4;
```

- [ ] **Step 3: Update `CLAUDE.md` styling bullet.** Replace the Styling bullet under "Frontend structure" with:

```markdown
- **Styling**: Tailwind v4 with an editorial (data-journalism) aesthetic —
  Fraunces display serif (`font-display`), Inter body, JetBrains Mono for
  price/figure columns (`font-mono`). Custom color tokens (`accent`, `dim`,
  `faint`, `hairline`, `panel`, `bg`, `ink`, `naik`, `turun`, `gold`) are
  defined in `app/globals.css` — use them, not raw hex. `.kicker` = small-caps
  section label. Theme is light-paper by default; dark (warm charcoal) toggled
  via `data-theme` on `<html>`.
```

Also in the "Data pipeline" section, note the new shapes: append to the `ingest.py` bullet: `Also emits weekly national history: trends get `spark` (≤12 weekly medians) and price shards are `{rows, hist}`.`

- [ ] **Step 4: Type + build check**

Run: `npx tsc --noEmit` — no output.
Run: `npm run build` — success, 2000+ static pages.

- [ ] **Step 5: Full browser verification — use the `verify` skill** (`.claude/skills/verify/`): `npm start -- -p 3111`, then with Claude-in-Chrome drive:
  - `/` — hero + answer line, search works (type "ayam"), sparklines render in boards, feature cards navigate, ticker scrolls, BM/EN toggle, theme toggle (dark = warm charcoal not black).
  - `/item/1355` — figures row, trend chart renders with hover tooltip, location filter still narrows table, sort works, add-to-basket works, cheapest row gold.
  - `/bakul` — added item appears, winner panel with serif total, my-shop picker works.
  - `/banding?a=<code>` — deep link hydrates, table + totals tint winner green.
  - Mobile width (resize to 375px) — no clipped columns, inputs 16px.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css CLAUDE.md
git commit -m "chore: drop legacy acid token, document editorial design system"
```

---

## Self-review notes

- Spec coverage: §1→Task 1, §2→Tasks 2–4, §3→Task 6, §4→Task 7, §5→Task 8, §6→Task 9, §7→Task 10, §8→Task 11, §9→Task 5, §10→global constraints + Task 12.
- Old-shape data safety: Task 4 normalizes bare-array shards; Task 3 makes the shop index accept both; `Trend.spark` optional and `Sparkline` renders a spacer when absent — so the app works even if Task 2's ingest run is skipped (charts simply don't show).
- Type consistency: `PriceFile`/`HistWeek` defined Task 4, consumed Tasks 5, 8; `ScopedStats` unchanged for `ShareBar`.
