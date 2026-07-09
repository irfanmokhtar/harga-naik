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

  // breadth-bar tap → jump to the matching board. boards are hidden while
  // searching, so clear the query first, then scroll on the next frame.
  const jumpToBoard = (id: string) => {
    setQuery("");
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      })
    );
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
        {/* market breadth bar — how much of the surveyed basket moved which way.
            each half jumps to its board (risers / fallers) — handy on mobile */}
        {nUp + nDown > 0 && (
          <div className="mt-6 max-w-xl">
            <div className="flex items-baseline justify-between font-mono text-[13px]">
              <button
                type="button"
                onClick={() => jumpToBoard("board-naik")}
                className="text-naik hover:underline"
              >
                ▲ {nUp} {lang === "ms" ? "naik" : "up"}
              </button>
              <button
                type="button"
                onClick={() => jumpToBoard("board-turun")}
                className="text-turun hover:underline"
              >
                {nDown} {lang === "ms" ? "turun" : "down"} ▼
              </button>
            </div>
            <div className="mt-2 flex h-1.5 gap-1">
              <button
                type="button"
                onClick={() => jumpToBoard("board-naik")}
                aria-label={
                  lang === "ms"
                    ? `${nUp} barang naik. Lompat ke barang paling naik`
                    : `${nUp} items up. Jump to biggest risers`
                }
                className="bg-naik cursor-pointer"
                style={{ width: `${(nUp / (nUp + nDown)) * 100}%` }}
              />
              <button
                type="button"
                onClick={() => jumpToBoard("board-turun")}
                aria-label={
                  lang === "ms"
                    ? `${nDown} barang turun. Lompat ke barang paling turun`
                    : `${nDown} items down. Jump to biggest fallers`
                }
                className="bg-turun flex-1 cursor-pointer"
              />
            </div>
            <p className="text-dim text-[12px] mt-2">
              {lang === "ms"
                ? `Perubahan harga median, ${periodLabel(lang, meta)}.`
                : `Median price change, ${periodLabel(lang, meta)}.`}
            </p>
          </div>
        )}

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
            <Board
              title={t("top")}
              tone="naik"
              movers={risers}
              itemByCode={itemByCode}
              id="board-naik"
            />
            <Board
              title={t("bottom")}
              tone="turun"
              movers={fallers}
              itemByCode={itemByCode}
              id="board-turun"
            />
          </section>
          <p className="mt-4 text-[11px] text-faint space-y-1">
            <span className="block">
              * {t("boardSub")} · {periodLabel(lang, meta)}.
            </span>
            <span className="block">* {t("coverageNote")}</span>
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
  tone,
  movers,
  itemByCode,
  id,
}: {
  title: string;
  tone: "naik" | "turun";
  movers: Trend[];
  itemByCode: Map<number, Item>;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-20">
      <h2 className="kicker border-b-2 border-ink pb-2">
        <span
          className={tone === "naik" ? "text-naik" : "text-turun"}
          aria-hidden="true"
        >
          {tone === "naik" ? "▲ " : "▼ "}
        </span>
        {title}
      </h2>
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
      <p className="mt-3 text-[13px] text-accent">
        {cta}{" "}
        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
          →
        </span>
      </p>
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
