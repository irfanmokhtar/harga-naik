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
  const rows = usePrices(item.code);
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
      <Link href="/" className="text-[12px] text-dim hover:text-acid">
        {t("backHome")}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {titleCase(item.name)}
          </h1>
          <p className="text-dim text-[12px] mt-1">
            {titleCase(item.category)} · {item.unit} · {t("asOf")}{" "}
            {meta.latestDate}
          </p>
        </div>
        <button
          onClick={() =>
            basket.has(item.code)
              ? basket.remove(item.code)
              : basket.add(item.code)
          }
          className={`border px-3 py-2.5 sm:py-1.5 text-[12px] cursor-pointer ${
            basket.has(item.code)
              ? "border-acid text-acid"
              : "border-hairline text-dim hover:text-ink hover:border-dim"
          }`}
        >
          {basket.has(item.code) ? `✓ ${t("inBasket")}` : t("addToBasket")}
        </button>
      </div>

      {/* stats strip */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-hairline border border-hairline">
        <Stat label={t("cheapest")} value={stats ? rm(stats.min) : "—"} acid />
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
      <p className="text-faint text-[11px] mt-1.5">
        {t("vsPrev")}: {periodLabel(lang, meta)}
      </p>

      {/* range bar */}
      {stats && stats.max > stats.min && (
        <div className="mt-3 relative h-6">
          <div className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
          <RangeMark stats={stats} />
        </div>
      )}

      <div className="mt-6">
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
      <div className="mt-4 border border-hairline">
        <div className="px-3 py-2 text-[11px] text-dim border-b border-hairline flex items-center justify-between gap-3">
          <span className="shrink-0">{t("priceSpread")}</span>
          <span className="shrink-0">
            {scoped?.length ?? "…"} {t("premises")}
          </span>
        </div>
        <div className="flex items-baseline gap-3 px-3 py-1.5 text-[10px] tracking-wide text-faint border-b border-hairline">
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
          <div className="px-3 py-6 text-dim text-[13px]">{t("loading")}</div>
        )}
        {visible && visible.length === 0 && (
          <div className="px-3 py-6 text-dim text-[13px]">{t("noData")}</div>
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
              className={`flex items-baseline gap-3 px-3 py-2 row-line last:border-b-0 text-[13px] ${
                isCheapest ? "bg-panel" : ""
              }`}
            >
              <span
                className={`w-16 shrink-0 ${isCheapest ? "text-acid font-bold" : ""}`}
              >
                {rm(price)}
              </span>
              <span
                className={`w-14 shrink-0 text-[11px] ${moveClass(pct)}`}
                title={prev !== null ? `${t("prevPrice")}: ${rm(prev)}` : ""}
              >
                {pct !== null ? `${moveArrow(pct)}${pctStr(pct)}` : "·"}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate">
                  {titleCase(premise.name)}
                  {isCheapest && <span className="text-acid"> ◀</span>}
                </span>
                <span className="block sm:hidden truncate text-dim text-[11px]">
                  {premise.district}, {premise.state} ·{" "}
                  <span className="text-faint">{row[3]}</span>
                </span>
              </span>
              <span className="hidden sm:inline w-40 shrink-0 truncate text-dim text-[11px]">
                {premise.district}, {premise.state}
              </span>
              <span className="hidden sm:inline w-20 shrink-0 text-right text-faint text-[11px]">
                {row[3]}
              </span>
            </div>
          );
        })}
        {scoped && scoped.length > PAGE && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full px-3 py-2 text-[12px] text-dim hover:text-acid border-t border-hairline cursor-pointer text-left"
          >
            {showAll
              ? t("showLess")
              : `${t("showAll")} (${scoped.length})`}
          </button>
        )}
      </div>
      <p className="text-faint text-[11px] mt-1.5">{t("coverageNote")}</p>

      {stats && (
        <ShareBar item={item} stats={stats} loc={loc} meta={meta} />
      )}
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
      className={`flex items-center gap-0.5 shrink-0 cursor-pointer hover:text-acid ${active ? "text-acid" : ""} ${className ?? ""}`}
    >
      {label}
      {active && <span>{dir === "asc" ? "▲" : "▼"}</span>}
    </button>
  );
}

function Stat({
  label,
  value,
  acid,
  className,
}: {
  label: string;
  value: string;
  acid?: boolean;
  className?: string;
}) {
  return (
    <div className="bg-bg px-3 py-3">
      <div className="text-[10px] tracking-widest text-faint uppercase">
        {label}
      </div>
      <div
        className={`mt-1 text-lg ${acid ? "text-acid" : ""} ${className ?? ""}`}
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
        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-acid"
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
