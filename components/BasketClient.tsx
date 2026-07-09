"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Item, Meta, Premise, PriceRow } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { loadPrices, useBasket, usePremises } from "@/lib/useData";
import { mapsUrl, rm, titleCase, wazeUrl } from "@/lib/format";
import { searchItems } from "@/lib/search";
import LocationPicker, {
  matchesLocation,
  type LocationFilter,
} from "@/components/LocationPicker";
import ShopPicker from "@/components/ShopPicker";

function GoogleMapsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="#EA4335"
      />
      <circle cx="12" cy="9" r="2.6" fill="#fff" />
    </svg>
  );
}

function WazeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="11" cy="12" r="9" fill="#33CCFF" />
      <circle cx="8" cy="11" r="1.3" fill="#053167" />
      <circle cx="14" cy="11" r="1.3" fill="#053167" />
      <path
        d="M7.5 14.8c1 1.1 2.1 1.6 3.5 1.6s2.5-.5 3.5-1.6"
        stroke="#053167"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="18" cy="6" r="2" fill="#33CCFF" stroke="#053167" strokeWidth="0.8" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="#25D366">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.08-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.13c-1.7 0-3.29-.47-4.65-1.28l-.33-.2-3.02.79.8-2.94-.21-.3A8.11 8.11 0 0 1 3.87 12c0-4.48 3.65-8.13 8.13-8.13S20.13 7.52 20.13 12 16.48 20.13 12 20.13z" />
      <path d="M16.7 14.24c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.58.13-.17.26-.66.84-.81 1.01-.15.17-.3.19-.56.06-.26-.13-1.09-.4-2.08-1.28-.77-.68-1.29-1.53-1.44-1.79-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.39-.79-1.9-.21-.5-.42-.43-.58-.44h-.5c-.17 0-.45.06-.68.32-.24.26-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.53.61.19 1.16.17 1.6.1.49-.07 1.53-.62 1.74-1.23.22-.6.22-1.11.15-1.22-.06-.11-.24-.17-.5-.3z" />
    </svg>
  );
}

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
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(shareText())}`,
                      "_blank",
                      "noopener"
                    )
                  }
                  className="flex items-center gap-1.5 border border-hairline px-3 py-2.5 sm:py-1.5 text-[12px] text-dim hover:text-ink hover:border-ink cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  {t("shareWhatsApp")}
                </button>
                <a
                  href={mapsUrl(winner.premise)}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-1.5 border border-hairline px-3 py-2.5 sm:py-1.5 text-[12px] text-dim hover:text-ink hover:border-ink"
                >
                  <GoogleMapsIcon className="w-4 h-4 shrink-0" />
                  {t("openMaps")}
                </a>
                <a
                  href={wazeUrl(winner.premise)}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-1.5 border border-hairline px-3 py-2.5 sm:py-1.5 text-[12px] text-dim hover:text-ink hover:border-ink"
                >
                  <WazeIcon className="w-4 h-4 shrink-0" />
                  {t("openWaze")}
                </a>
              </div>
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
                  <span className="hidden sm:flex shrink-0 gap-2">
                    <a
                      href={mapsUrl(r.premise)}
                      target="_blank"
                      rel="noopener"
                      title={t("openMaps")}
                    >
                      <GoogleMapsIcon className="w-4 h-4" />
                    </a>
                    <a
                      href={wazeUrl(r.premise)}
                      target="_blank"
                      rel="noopener"
                      title={t("openWaze")}
                    >
                      <WazeIcon className="w-4 h-4" />
                    </a>
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
