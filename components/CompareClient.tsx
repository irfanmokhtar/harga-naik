"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Item, Meta, Premise, ShopPriceRow } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import {
  loadShopPrices,
  usePremises,
  useShopStats,
} from "@/lib/useData";
import { rm, titleCase } from "@/lib/format";
import ShopPicker from "@/components/ShopPicker";

export default function CompareClient({
  items,
  meta,
}: {
  items: Item[];
  meta: Meta;
}) {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const premises = usePremises();
  const stats = useShopStats();
  const [a, setA] = useState<Premise | null>(null);
  const [b, setB] = useState<Premise | null>(null);
  const [rowsA, setRowsA] = useState<ShopPriceRow[] | null>(null);
  const [rowsB, setRowsB] = useState<ShopPriceRow[] | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // hydrate picks from ?a=&b= deep link once premises load
  useEffect(() => {
    if (!premises || hydrated) return;
    setHydrated(true);
    const pa = premises.get(Number(searchParams.get("a")));
    const pb = premises.get(Number(searchParams.get("b")));
    if (pa) setA(pa);
    if (pb) setB(pb);
  }, [premises, hydrated, searchParams]);

  // keep URL shareable
  useEffect(() => {
    if (!hydrated) return;
    const q = new URLSearchParams();
    if (a) q.set("a", String(a.code));
    if (b) q.set("b", String(b.code));
    router.replace(q.size ? `/banding?${q}` : "/banding", { scroll: false });
  }, [a, b, hydrated, router]);

  useEffect(() => {
    setRowsA(null);
    if (a) loadShopPrices(a.code).then(setRowsA);
  }, [a]);
  useEffect(() => {
    setRowsB(null);
    if (b) loadShopPrices(b.code).then(setRowsB);
  }, [b]);

  const itemByCode = useMemo(
    () => new Map(items.map((i) => [i.code, i])),
    [items]
  );
  const allPremises = useMemo(
    () => (premises ? [...premises.values()] : []),
    [premises]
  );

  const table = useMemo(() => {
    if (!rowsA || !rowsB) return null;
    const pa = new Map(rowsA.map((r) => [r[0], r[1]]));
    const pb = new Map(rowsB.map((r) => [r[0], r[1]]));
    const codes = [...new Set([...pa.keys(), ...pb.keys()])].filter((c) =>
      itemByCode.has(c)
    );
    const rows = codes
      .map((c) => ({
        item: itemByCode.get(c)!,
        pa: pa.get(c) ?? null,
        pb: pb.get(c) ?? null,
      }))
      .sort((x, y) => x.item.name.localeCompare(y.item.name));
    let totalA = 0;
    let totalB = 0;
    let common = 0;
    for (const r of rows) {
      if (r.pa !== null && r.pb !== null) {
        totalA += r.pa;
        totalB += r.pb;
        common++;
      }
    }
    return { rows, totalA, totalB, common };
  }, [rowsA, rowsB, itemByCode]);

  return (
    <div className="pt-6">
      <Link href="/" className="text-[12px] text-dim hover:text-acid">
        {t("backHome")}
      </Link>
      <h1 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight">
        {t("compareShops")}
        <span className="text-faint">_</span>
      </h1>
      <p className="text-faint mt-1 text-[11px]">
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
        <div className="mt-6 border border-hairline">
          <div className="flex items-baseline gap-3 px-3 py-2 text-[11px] text-dim border-b border-hairline">
            <span className="flex-1 min-w-0">{t("item")}</span>
            <span className="w-20 text-right truncate">
              {titleCase(a.name).split(" ")[0]}
            </span>
            <span className="w-20 text-right truncate">
              {titleCase(b.name).split(" ")[0]}
            </span>
          </div>
          {table.rows.length === 0 && (
            <div className="px-3 py-6 text-dim text-[13px]">{t("noData")}</div>
          )}
          {table.rows.map(({ item, pa, pb }) => {
            const aWins = pa !== null && pb !== null && pa < pb;
            const bWins = pa !== null && pb !== null && pb < pa;
            return (
              <Link
                key={item.code}
                href={`/item/${item.code}`}
                className="flex items-baseline gap-3 px-3 py-2 row-line last:border-b-0 text-[13px] hover:bg-panel group"
              >
                <span className="flex-1 min-w-0 truncate group-hover:text-acid">
                  {titleCase(item.name)}
                </span>
                <span
                  className={`w-20 text-right shrink-0 ${
                    aWins ? "text-acid font-bold" : pa === null ? "text-faint" : ""
                  }`}
                >
                  {pa !== null ? rm(pa) : "—"}
                </span>
                <span
                  className={`w-20 text-right shrink-0 ${
                    bWins ? "text-acid font-bold" : pb === null ? "text-faint" : ""
                  }`}
                >
                  {pb !== null ? rm(pb) : "—"}
                </span>
              </Link>
            );
          })}
          {table.common > 0 && (
            <div className="flex items-baseline gap-3 px-3 py-2.5 border-t border-hairline text-[13px] font-bold">
              <span className="flex-1 min-w-0 truncate">
                {t("commonItemsTotal")}{" "}
                <span className="text-dim font-normal text-[11px]">
                  ({table.common} {t("item").toLowerCase()})
                </span>
              </span>
              <span
                className={`w-20 text-right shrink-0 ${
                  table.totalA < table.totalB ? "text-acid" : ""
                }`}
              >
                {rm(table.totalA)}
              </span>
              <span
                className={`w-20 text-right shrink-0 ${
                  table.totalB < table.totalA ? "text-acid" : ""
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
}
