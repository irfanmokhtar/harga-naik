"use client";

import { useState } from "react";
import type { Premise } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { titleCase } from "@/lib/format";
import { searchPremises } from "@/lib/search";

export default function ShopPicker({
  premises,
  value,
  onChange,
}: {
  premises: Premise[];
  value: Premise | null;
  onChange: (p: Premise | null) => void;
}) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const results = query.trim()
    ? searchPremises(premises, query).slice(0, 8)
    : [];

  if (value) {
    return (
      <div className="flex items-baseline gap-2 border border-hairline px-3 py-2.5 sm:py-2 text-[13px]">
        <span className="flex-1 min-w-0 truncate">
          {titleCase(value.name)}
          <span className="text-dim text-[11px]">
            {" "}
            — {value.district}, {value.state}
          </span>
        </span>
        <button
          onClick={() => onChange(null)}
          className="text-faint hover:text-naik text-[11px] cursor-pointer px-2 py-1.5 -my-1.5 -mr-2"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("pickShop")}
        className="w-full bg-panel border border-hairline px-3 py-2.5 text-[16px] sm:text-[13px] outline-none focus:border-accent placeholder:text-faint"
      />
      {results.length > 0 && (
        <div className="absolute z-10 left-0 right-0 top-full bg-bg border border-hairline max-h-72 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.code}
              onClick={() => {
                onChange(p);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2.5 sm:py-2 row-line last:border-b-0 text-[13px] hover:bg-panel hover:text-accent cursor-pointer flex justify-between gap-3"
            >
              <span className="truncate">{titleCase(p.name)}</span>
              <span className="text-faint text-[11px] shrink-0 truncate max-w-[45%]">
                {p.district}, {p.state}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
