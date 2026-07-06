"use client";

import Link from "next/link";
import type { Item, Trend } from "@/lib/types";
import { pctStr, titleCase } from "@/lib/format";

export default function Ticker({
  movers,
  itemByCode,
}: {
  movers: Trend[];
  itemByCode: Map<number, Item>;
}) {
  const top = [...movers.slice(0, 10), ...movers.slice(-10)].filter(
    (m, i, arr) => arr.findIndex((x) => x.code === m.code) === i
  );
  if (top.length === 0) return null;

  const entries = top.map((m) => {
    const item = itemByCode.get(m.code)!;
    const up = m.pct! > 0;
    return (
      <Link
        key={m.code}
        href={`/item/${m.code}`}
        className="inline-flex items-baseline gap-2 px-4 shrink-0 hover:bg-panel"
      >
        <span className="text-[12px] text-dim">{titleCase(item.name)}</span>
        <span
          className={`text-[12px] font-mono ${up ? "text-naik" : "text-turun"}`}
        >
          {up ? "▲" : "▼"} {pctStr(m.pct!)}
        </span>
      </Link>
    );
  });

  return (
    <div className="border-b border-hairline -mx-4 overflow-hidden whitespace-nowrap">
      <div className="ticker-track inline-flex py-2">
        {entries}
        {entries.map((e) => (
          <span key={`dup-${e.key}`} aria-hidden="true">
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}
