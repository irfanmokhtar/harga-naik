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
    out.sort(
      (a, b) => (a.pct ?? Infinity) - (b.pct ?? Infinity)
    );
    return out;
  }, [rows, itemByCode, medByCode]);

  const visible = showAll ? joined : joined?.slice(0, PAGE);

  return (
    <div className="pt-6">
      <Link href="/" className="text-[12px] text-dim hover:text-acid">
        {t("backHome")}
      </Link>

      <div className="mt-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {titleCase(premise.name)}
        </h1>
        <p className="text-dim text-[12px] mt-1">
          {titleCase(premise.address)} · {titleCase(premise.district)},{" "}
          {premise.state} · {premise.type}
        </p>
      </div>

      {/* stats strip */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-px bg-hairline border border-hairline">
        <Stat
          label={t("cheapnessScore")}
          value={stat ? `${stat.score}%` : "—"}
          acid={!!stat && stat.score >= 60}
        />
        <Stat
          label={t("itemsAtShop")}
          value={stat ? String(stat.n) : "—"}
        />
        <Stat label={t("asOf")} value={meta.latestDate} />
      </div>
      <p className="text-faint text-[11px] mt-1.5">{t("scoreNote")}</p>

      <div className="mt-3">
        <Link
          href={`/banding?a=${premise.code}`}
          className="inline-block border border-hairline px-3 py-1.5 text-[12px] text-dim hover:text-acid hover:border-acid"
        >
          {t("compareThisShop")} →
        </Link>
      </div>

      {/* price table */}
      <div className="mt-6 border border-hairline">
        <div className="px-3 py-2 text-[11px] text-dim border-b border-hairline flex justify-between">
          <span>{t("price")}</span>
          <span>{t("vsMedian")}</span>
        </div>
        {!visible && (
          <div className="px-3 py-6 text-dim text-[13px]">{t("loading")}</div>
        )}
        {visible && visible.length === 0 && (
          <div className="px-3 py-6 text-dim text-[13px]">{t("noData")}</div>
        )}
        {visible?.map(({ item, price, date, pct }) => (
          <Link
            key={item.code}
            href={`/item/${item.code}`}
            className="flex items-baseline gap-3 px-3 py-2 row-line last:border-b-0 text-[13px] hover:bg-panel group"
          >
            <span className="flex-1 min-w-0">
              <span className="block truncate group-hover:text-acid">
                {titleCase(item.name)}
              </span>
              <span className="block sm:hidden truncate text-dim text-[11px]">
                {item.unit} · <span className="text-faint">{date}</span>
              </span>
            </span>
            <span className="hidden sm:inline w-24 shrink-0 truncate text-faint text-[11px]">
              {item.unit}
            </span>
            <span className="w-18 text-right shrink-0">{rm(price)}</span>
            <span className="w-24 text-right shrink-0 text-[12px]">
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
            className="w-full px-3 py-2 text-[12px] text-dim hover:text-acid border-t border-hairline cursor-pointer text-left"
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
  acid,
}: {
  label: string;
  value: string;
  acid?: boolean;
}) {
  return (
    <div className="bg-bg px-3 py-3">
      <div className="text-[10px] tracking-widest text-faint uppercase">
        {label}
      </div>
      <div className={`mt-1 text-lg ${acid ? "text-acid" : ""}`}>{value}</div>
    </div>
  );
}
