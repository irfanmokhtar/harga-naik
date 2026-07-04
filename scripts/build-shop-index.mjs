// Inverts public/data/prices/{itemCode}.json (rows [premise_code, price, prev, date])
// into per-shop files public/data/shops/{premiseCode}.json (rows [item_code, price, prev, date])
// plus public/data/shops-index.json with per-shop stats:
//   { code, n, cheap, score } — score = % of items priced below the item's national median.
// Runs as npm prebuild; safe no-op when price data is absent (fresh clone).

import { readFileSync, readdirSync, writeFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "data");
const PRICES = join(DATA, "prices");
const SHOPS = join(DATA, "shops");

if (!existsSync(PRICES)) {
  console.log("build-shop-index: no price data, skipping");
  process.exit(0);
}

const premises = JSON.parse(readFileSync(join(DATA, "premises.json"), "utf8"));
const trends = JSON.parse(readFileSync(join(DATA, "trends.json"), "utf8"));
const medByItem = new Map(trends.map((t) => [t.code, t.med]));

// premise_code -> rows [item_code, price, prev, date]
const byShop = new Map(premises.map((p) => [p.code, []]));

for (const file of readdirSync(PRICES)) {
  if (!file.endsWith(".json")) continue;
  const itemCode = Number(basename(file, ".json"));
  const rows = JSON.parse(readFileSync(join(PRICES, file), "utf8"));
  for (const [premiseCode, price, prev, date] of rows) {
    let bucket = byShop.get(premiseCode);
    if (!bucket) byShop.set(premiseCode, (bucket = []));
    bucket.push([itemCode, price, prev, date]);
  }
}

rmSync(SHOPS, { recursive: true, force: true });
mkdirSync(SHOPS, { recursive: true });

const index = [];
let files = 0;
for (const [code, rows] of byShop) {
  if (rows.length === 0) continue;
  rows.sort((a, b) => a[0] - b[0]);
  writeFileSync(join(SHOPS, `${code}.json`), JSON.stringify(rows));
  files++;

  let n = 0;
  let cheap = 0;
  for (const [itemCode, price] of rows) {
    const med = medByItem.get(itemCode);
    if (med == null) continue;
    n++;
    if (price < med) cheap++;
  }
  index.push({ code, n, cheap, score: n ? Math.round((100 * cheap) / n) : 0 });
}

index.sort((a, b) => a.code - b.code);
writeFileSync(join(DATA, "shops-index.json"), JSON.stringify(index));
console.log(`build-shop-index: ${files} shop files, ${index.length} indexed`);
