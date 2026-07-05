"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Item, Meta, Premise, ShopStat, Trend } from "@/lib/types";
import { useLang, periodLabel } from "@/lib/i18n";
import { searchItems, searchPremises } from "@/lib/search";
import { loadPremises, loadShopStats } from "@/lib/useData";
import { rm, pctStr, moveClass, moveArrow, titleCase } from "@/lib/format";
import Ticker from "@/components/Ticker";

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

  return (
    <div>
      <Ticker movers={movers} itemByCode={itemByCode} />

      {/* masthead + search */}
      <section className="py-10 sm:py-14">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
          <span className="text-acid">Harga</span>Naik<span className="text-acid">Ke</span>
          <span className="text-faint">_</span>
        </h1>
        <p className="text-dim mt-1 text-[13px]">{t("tagline")}</p>
        <p className="text-faint mt-1 text-[11px]">
          {items.length} {t("itemsTracked")} · {t("asOf")} {meta.latestDate}
        </p>
        <p className="text-faint text-[11px]">{t("coverageNote")}</p>

        <div className="mt-6 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-acid">
            &gt;
          </span>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-panel border border-hairline pl-8 pr-3 py-3 text-[16px] sm:text-[14px] outline-none focus:border-acid placeholder:text-faint"
          />
        </div>
        <p className="text-faint text-[11px] mt-1.5">{t("searchHint")}</p>

        {query.trim() && (
          <div className="mt-4 border border-hairline">
            <div className="px-3 py-2 text-[11px] text-dim border-b border-hairline">
              {results.length} {t("results")}
            </div>
            {results.length === 0 && shopResults.length === 0 && (
              <div className="px-3 py-4 text-dim text-[13px]">
                {t("noData")}
              </div>
            )}
            {results.map((item) => {
              const tr = trendByCode.get(item.code);
              return (
                <Link
                  key={item.code}
                  href={`/item/${item.code}`}
                  className="flex items-baseline gap-3 px-3 py-2.5 row-line last:border-b-0 hover:bg-panel group"
                >
                  <span className="flex-1 min-w-0 truncate group-hover:text-acid">
                    {titleCase(item.name)}
                  </span>
                  <span className="text-faint text-[11px] shrink-0">
                    {item.unit}
                  </span>
                  {tr && (
                    <span className="w-20 text-right shrink-0">
                      {rm(tr.med)}
                    </span>
                  )}
                  {tr && (
                    <span
                      className={`w-16 text-right text-[12px] shrink-0 ${moveClass(tr.pct)}`}
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
                <div className="px-3 py-2 text-[11px] tracking-widest text-dim border-b border-t border-hairline">
                  {t("shops")} · {shopResults.length}
                </div>
                {shopResults.map((p) => {
                  const stat = shopStats?.get(p.code);
                  return (
                    <Link
                      key={p.code}
                      href={`/kedai/${p.code}`}
                      className="flex items-baseline gap-3 px-3 py-2.5 row-line last:border-b-0 hover:bg-panel group"
                    >
                      <span className="flex-1 min-w-0 truncate group-hover:text-acid">
                        {titleCase(p.name)}
                      </span>
                      <span className="text-dim text-[11px] shrink-0 max-w-[40%] truncate">
                        {titleCase(p.district)}, {p.state}
                      </span>
                      {stat && (
                        <span
                          className={`w-20 text-right text-[12px] shrink-0 ${
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

      {/* barang naik board */}
      {!query.trim() && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-hairline border border-hairline">
          <Board
            title={t("top")}
            movers={risers}
            itemByCode={itemByCode}
          />
          <Board
            title={t("bottom")}
            movers={fallers}
            itemByCode={itemByCode}
          />
          <div className="sm:col-span-2 bg-bg px-3 py-2 text-[11px] text-faint">
            {t("boardSub")} · {periodLabel(lang, meta)}
          </div>
        </section>
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
    <div className="bg-bg">
      <h2 className="px-3 py-2 text-[11px] tracking-widest text-dim border-b border-hairline">
        {title}
      </h2>
      {movers.map((m) => {
        const item = itemByCode.get(m.code)!;
        return (
          <Link
            key={m.code}
            href={`/item/${m.code}`}
            className="flex items-baseline gap-3 px-3 py-2.5 sm:py-2 row-line last:border-b-0 hover:bg-panel group"
          >
            <span className="flex-1 min-w-0 truncate text-[13px] group-hover:text-acid">
              {titleCase(item.name)}
            </span>
            <span className="w-18 text-right text-[13px]">{rm(m.med)}</span>
            <span
              className={`w-16 text-right text-[13px] ${moveClass(m.pct)}`}
            >
              {moveArrow(m.pct)} {pctStr(m.pct!)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
