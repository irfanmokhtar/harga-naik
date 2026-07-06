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
      <Link href="/" className="kicker hover:text-accent">
        {t("backHome")}
      </Link>
      <h1 className="mt-4 font-display font-semibold text-3xl sm:text-4xl tracking-tight">
        {t("compareShops")}
      </h1>
      <p className="text-faint mt-2 text-[11px]">
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
        <div className="mt-8">
          <div className="flex items-baseline gap-3 pb-2 border-b-2 border-ink">
            <span className="flex-1 min-w-0 kicker">{t("item")}</span>
            <span className="w-20 text-right truncate kicker">
              {titleCase(a.name).split(" ")[0]}
            </span>
            <span className="w-20 text-right truncate kicker">
              {titleCase(b.name).split(" ")[0]}
            </span>
          </div>
          {table.rows.length === 0 && (
            <div className="py-6 text-dim text-[13px]">{t("noData")}</div>
          )}
          {table.rows.map(({ item, pa, pb }) => {
            const aWins = pa !== null && pb !== null && pa < pb;
            const bWins = pa !== null && pb !== null && pb < pa;
            return (
              <Link
                key={item.code}
                href={`/item/${item.code}`}
                className="flex items-baseline gap-3 py-2 row-line text-[13px] hover:bg-panel group -mx-2 px-2"
              >
                <span className="flex-1 min-w-0 truncate group-hover:text-accent">
                  {titleCase(item.name)}
                </span>
                <span
                  className={`w-20 text-right shrink-0 font-mono ${
                    aWins
                      ? "text-turun font-semibold"
                      : pa === null
                        ? "text-faint"
                        : ""
                  }`}
                >
                  {pa !== null ? rm(pa) : "—"}
                </span>
                <span
                  className={`w-20 text-right shrink-0 font-mono ${
                    bWins
                      ? "text-turun font-semibold"
                      : pb === null
                        ? "text-faint"
                        : ""
                  }`}
                >
                  {pb !== null ? rm(pb) : "—"}
                </span>
              </Link>
            );
          })}
          {table.common > 0 && (
            <div className="flex items-baseline gap-3 py-3 border-t-2 border-ink text-[13px] font-semibold">
              <span className="flex-1 min-w-0 truncate">
                {t("commonItemsTotal")}{" "}
                <span className="text-dim font-normal text-[11px]">
                  ({table.common} {t("item").toLowerCase()})
                </span>
              </span>
              <span
                className={`w-20 text-right shrink-0 font-mono text-[15px] ${
                  table.totalA < table.totalB ? "text-turun" : ""
                }`}
              >
                {rm(table.totalA)}
              </span>
              <span
                className={`w-20 text-right shrink-0 font-mono text-[15px] ${
                  table.totalB < table.totalA ? "text-turun" : ""
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
