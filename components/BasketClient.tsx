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
      <Link href="/" className="text-[12px] text-dim hover:text-acid">
        {t("backHome")}
      </Link>
      <h1 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight">
        {t("basket")}
        <span className="text-faint">_</span>
      </h1>

      {/* add items */}
      <div className="mt-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-acid">
          &gt;
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full bg-panel border border-hairline pl-8 pr-3 py-2.5 text-[16px] sm:text-[13px] outline-none focus:border-acid placeholder:text-faint"
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
                className="w-full text-left px-3 py-2.5 sm:py-2 row-line last:border-b-0 text-[13px] hover:bg-panel hover:text-acid cursor-pointer flex justify-between gap-3"
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
          <div className="mt-4 border border-hairline">
            {basketItems.map((item) => (
              <div
                key={item.code}
                className="flex items-baseline gap-3 px-3 py-2 row-line last:border-b-0 text-[13px]"
              >
                <Link
                  href={`/item/${item.code}`}
                  className="flex-1 min-w-0 truncate hover:text-acid"
                >
                  {titleCase(item.name)}
                </Link>
                <span className="text-faint text-[11px]">{item.unit}</span>
                {winner && (
                  <span className="w-20 text-right">
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
            <div className="mt-6 border border-acid p-4">
              <div className="text-[10px] tracking-widest text-faint uppercase">
                {t("basketCheapest")}
              </div>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="text-lg font-bold">
                    {titleCase(winner.premise.name)}
                  </div>
                  <div className="text-dim text-[12px]">
                    {winner.premise.district}, {winner.premise.state} ·{" "}
                    {winner.premise.type}
                  </div>
                </div>
                <div className="text-2xl text-acid font-bold">
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
                className="mt-3 border border-hairline px-3 py-2.5 sm:py-1.5 text-[12px] text-dim hover:text-ink hover:border-dim cursor-pointer"
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
          <div className="mt-6">
            <div className="text-[10px] tracking-widest text-faint uppercase mb-2">
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
                  <div className="text-2xl font-bold">{rm(mine.total)}</div>
                </div>
                {winner && mine.found === basket.codes.length && (
                  <div
                    className={`mt-1 text-right text-[12px] ${
                      mine.total > winner.total ? "text-naik" : "text-acid"
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
            <div className="mt-4 border border-hairline">
              <div className="px-3 py-2 text-[11px] text-dim border-b border-hairline flex justify-between">
                <span>{t("basketTotal")}</span>
                <span>
                  {ranking.length} {t("premises")}
                </span>
              </div>
              {ranking.slice(0, 20).map((r, idx) => (
                <div
                  key={r.premise.code}
                  className={`flex items-baseline gap-3 px-3 py-2 row-line last:border-b-0 text-[13px] ${
                    r === winner ? "bg-panel" : ""
                  }`}
                >
                  <span
                    className={`w-20 shrink-0 ${r === winner ? "text-acid font-bold" : ""}`}
                  >
                    {rm(r.total)}
                  </span>
                  <span className="w-14 shrink-0 text-[11px] text-dim">
                    {r.found}/{basket.codes.length}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">
                      {titleCase(r.premise.name)}
                      {r === winner && <span className="text-acid"> ◀</span>}
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
              <div className="px-3 py-2 text-[10px] text-faint border-t border-hairline">
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
