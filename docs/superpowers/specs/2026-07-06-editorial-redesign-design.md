# HargaNaikKe Editorial Redesign — Design Spec

**Date:** 2026-07-06
**Status:** Approved by user (interactive brainstorm)

## Goal

Full visual/UX redesign of HargaNaikKe from terminal-mono aesthetic to
**editorial data-journalism** style (FT/Bloomberg data-desk feel): serif
display headlines, quiet sans body, mono numerals, generous typographic
hierarchy, newspaper devices (rules, kickers, datelines). Premium and
distinctive — explicitly avoiding generic "AI slop" patterns (gradients,
glassmorphism, rounded-2xl shadow cards).

All existing functionality kept and made more discoverable. Implementation
approach: **in-place restyle** — keep all logic (search, sorting, basket,
lazy data loading, i18n, SSG), rewrite presentation, add new components,
extend ingest for price history.

## Decisions (user-confirmed)

1. **Direction:** editorial data-journalism.
2. **Data:** extend `ingest/ingest.py` to emit weekly price history
   (unlocks sparklines + trend charts).
3. **Home IA:** search-first with feature cards (not a full dashboard;
   not a pure reskin).
4. **Theme:** light (paper) default + refined warm-dark; toggle stays.
5. **Approach:** in-place restyle (option A), not ground-up rebuild.

## 1. Design system

### Typography (via `next/font/google`, self-hosted at build)

| Role | Font | Usage |
|------|------|-------|
| Display serif | Fraunces | Headlines, item/shop names as titles, hero figures |
| UI/body sans | Inter | Body copy, labels, nav, table text |
| Numeric mono | JetBrains Mono | Price and pct columns only (tabular) |

### Palette

Light (default) — CSS tokens in `app/globals.css` `@theme`:

- `bg` paper `#faf7f0`, `panel` slightly deeper cream
- `ink` `#1c1a17`; `dim`/`faint` warm grays; `hairline` `#e5e0d4`
- `naik` vermillion `#c2402a` (up = bad = red family, unchanged semantics)
- `turun` deep green `#1e6b4f`
- **`accent`** newspaper navy `#23479c` — links, focus rings, active sort
  (replaces `acid` as the interactive color)
- Cheapest-row highlight: ochre tint

Dark: warm charcoal `#161412` bg, cream ink `#ece7dd`, same semantic hues
lightened for contrast. Not terminal black.

Token migration: `acid` token removed/renamed to `accent`; all usages
updated. `naik`/`turun`/`dim`/`faint`/`hairline`/`panel`/`bg`/`ink` names
kept.

### Layout & texture

- Content column `max-w-4xl`; tables span full column.
- Newspaper devices only: thick 2px section rules, hairlines, small-caps
  kicker labels, dateline rows. No gradients, no glass, no drop shadows.

## 2. Data pipeline extension

- `ingest/ingest.py` pulls **4 months** of parquet (currently 2).
- New computation: weekly national median per item (ISO week), using the
  existing outlier filter (>4× / <¼× national median dropped first).
- `trends.json` rows gain `spark: number[]` — last 12 weekly medians.
  ~800 items × 12 floats ≈ ~50 KB; acceptable in the SSG bundle.
- `prices/{code}.json` changes shape from a bare array to
  `{ rows: PriceRow[], hist: [weekStartISO, min, med, max][] }`.
  Fetched lazily client-side, so bundle unaffected.
- `scripts/build-shop-index.mjs` updated to read the `rows` key (must
  still no-op safely on fresh clone / old-shape files).
- `lib/types.ts` documents the new shapes; `lib/useData.tsx` adapts.
- Current/previous window math **unchanged** (CLAUDE.md window model).
- Committed sample artifacts regenerated so fresh clones still work.

## 3. Shared chrome

- **Header → masthead:** serif nameplate; hairline + thick rule beneath;
  dateline strip (latest date, item/premise counts, coverage note); nav
  right in small caps: Bakul · Banding · BM/EN · theme toggle.
- **Ticker → bourse strip:** thin strip under masthead rule, mono
  figures; existing marquee/pause/reduced-motion logic kept.
- **Footer → colophon:** source, license, one-line window methodology.

## 4. Home page (search-first + feature cards)

1. Hero: serif headline question *"Harga naik ke, minggu ini?"* plus a
   computed answer line from `trends` (e.g. "42 barang naik, 38 turun ·
   minggu berakhir 4 Jul"). BM/EN both.
2. Large search field; existing search logic and lazy shop-data loading
   untouched; results list restyled (item + shop results).
3. NAIK/TURUN two-column board; each row: name, 12-week `Sparkline`,
   mono price, pct.
4. Three feature cards below the board: **Bakul**, **Banding**,
   **Kedai** — small-caps kicker, one serif explanatory line, arrow
   link. Kedai card points at shop search.
5. Dateline/coverage note kept.

## 5. Item page

- Serif title; category/unit/date as dateline; basket button restyled.
- Stats strip → editorial figures row (large serif numerals):
  cheapest / median / highest / vs-prev.
- **New `TrendChart`:** 12-week hand-rolled SVG — median line +
  min/max band from `hist`. Range distribution strip kept.
- Price table: identical sort/location-filter/pagination logic;
  editorial styling; cheapest row ochre-highlighted.
- ShareBar restyled (share-card generator palette updated to match).

## 6. Kedai page

- Editorial reskin. Cheapness score as a big stat with plain-language
  framing ("murah dari median pada 62% barang").

## 7. Bakul page

- Total basket cost as hero serif figure; per-shop cheapest table below.
  Basket logic (`localStorage`, `useSyncExternalStore`) untouched.

## 8. Banding page

- Comparison table reskin; winner column tinted (turun green tint).

## 9. Chart components

- `components/Sparkline.tsx` — tiny inline SVG line, med series.
- `components/TrendChart.tsx` — line + min/max band, minimal axis labels.
- No chart library. Read the `dataviz` skill before writing either.

## 10. Constraints (unchanged invariants)

- Every new user-facing string added to **both** `STRINGS.ms` and
  `STRINGS.en`.
- Inputs compute 16 px font below 640 px (iOS zoom rule); mobile-first
  column hiding kept.
- Positional tuple data shapes stay compact; changes documented in
  `lib/types.ts`.
- All pages remain SSG (`generateStaticParams` + `dynamicParams=false`).
- Never present data as inflation/CPI.
- Verification: `verify` skill (build, `npm start -- -p 3111`, drive
  `/`, `/item/1355`, `/bakul` via browser) + `npx tsc --noEmit`.

## Out of scope

- No new routes, no backend, no runtime API.
- No per-premise history (weekly medians are national only).
- No chart library dependency.
