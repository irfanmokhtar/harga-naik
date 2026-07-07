# Banding Page — Item Search Design

## Goal

On `/banding` (Compare Shops), once both shops are selected and the
comparison table has loaded, let the user search/filter the item list to
find a specific item's price at each shop quickly, instead of scrolling a
potentially long alphabetical list.

## Scope

- Client-side filtering only. No new data fetch — the item list is already
  loaded into `table.rows` once both shops' price shards resolve.
- Isolated to `components/CompareClient.tsx` + two new `lib/i18n.tsx` keys.
- No changes to URL sync, deep-link hydration (`?a=&b=`), `ShopPicker`, or
  the totals calculation.

## Behavior

- A search input renders above the item/shop-name header row, only when
  `a && b && table` (i.e. both shops picked and prices loaded). It is not
  shown while only zero or one shop is selected, or while prices are still
  loading.
- Empty query → full alphabetically-sorted row list (current behavior),
  totals row unaffected.
- Non-empty query → rows are filtered and re-ordered by relevance using the
  existing `searchItems()` helper from `lib/search.ts` (same fuzzy BM+EN
  matching used on the home page and bakul page).
- The totals row ("Jumlah barang" common-item sum, and both shops' summed
  totals) is always computed from the **full** `table.rows`/`table.common`
  — the search box is a lookup aid, not a sub-basket builder. It never
  recalculates based on the filtered view.
- The query resets to `""` whenever either shop selection (`a` or `b`)
  changes, so a stale filter doesn't hide the new pair's items.
- If the filtered list is empty (query matches nothing), show new copy
  "Tiada barang sepadan" (BM) / "No matching items" (EN) — distinct from
  the existing `noData` string ("Tiada data"), which covers the case where
  neither shop has any priced items at all.

## Data flow

```
table.rows (existing, sorted alpha, includes items priced at either shop)
        │
        ▼ (memoized on [table, query])
filteredRows = query
  ? rank rows.item via searchItems(rows.map(r => r.item), query),
    filter to items with score > 0, reorder by rank
  : table.rows

render: filteredRows.map(...)   ← replaces table.rows.map(...) in JSX
totals: table.totalA / table.totalB / table.common   ← unchanged, always full
```

## New i18n keys

Add to both `STRINGS.ms` and `STRINGS.en` in `lib/i18n.tsx`:

- `filterItemsPlaceholder`: "Tapis barang…" / "Filter items…"
- `noMatchingItems`: "Tiada barang sepadan" / "No matching items"

## Styling

- Reuse existing input pattern (token classes, `text-[16px] sm:text-...`
  for the iOS zoom rule) — match the style of the existing `ShopPicker`
  search inputs already on this page.

## Error handling / edge cases

- `table` is `null` while prices are loading — search input isn't rendered
  yet, so no filtering logic runs on incomplete data.
- Switching a shop mid-search clears the query (see Behavior) — prevents a
  filter computed against the old pair silently hiding all rows for the
  new pair.
- `searchItems` already handles empty/whitespace query by returning `[]`
  internally; the component treats an empty (trimmed) query as "no filter"
  before calling it, so this path isn't exercised with an empty string.

## Testing

No test suite in this repo (see CLAUDE.md). Verify via:
- `npx tsc --noEmit` (must print nothing)
- Browser drive per `.claude/skills/verify/`: type a query and confirm
  ranked filtering, confirm totals stay unchanged while filtered, confirm
  query resets when either shop is swapped, confirm the no-match copy
  appears for a nonsense query, confirm mobile input renders 16px.
