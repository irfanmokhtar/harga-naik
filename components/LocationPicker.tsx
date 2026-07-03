"use client";

import { useMemo } from "react";
import type { Premise } from "@/lib/types";
import { useLang } from "@/lib/i18n";

export interface LocationFilter {
  state: string;
  district: string;
}

export default function LocationPicker({
  premises,
  value,
  onChange,
}: {
  premises: Premise[];
  value: LocationFilter;
  onChange: (v: LocationFilter) => void;
}) {
  const { t } = useLang();

  const states = useMemo(
    () => [...new Set(premises.map((p) => p.state))].sort(),
    [premises]
  );
  const districts = useMemo(
    () =>
      value.state
        ? [
            ...new Set(
              premises
                .filter((p) => p.state === value.state)
                .map((p) => p.district)
            ),
          ].sort()
        : [],
    [premises, value.state]
  );

  const cls =
    "bg-panel border border-hairline px-3 py-2 pr-7 text-[16px] sm:text-[13px] outline-none focus:border-acid text-ink w-full cursor-pointer";

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="block">
        <span className="block text-[11px] text-dim mb-1">{t("state")}</span>
        <select
          className={cls}
          value={value.state}
          onChange={(e) => onChange({ state: e.target.value, district: "" })}
        >
          <option value="">{t("allStates")}</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-[11px] text-dim mb-1">
          {t("district")}
        </span>
        <select
          className={cls}
          value={value.district}
          disabled={!value.state}
          onChange={(e) => onChange({ ...value, district: e.target.value })}
        >
          <option value="">{t("allDistricts")}</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function matchesLocation(p: Premise, f: LocationFilter): boolean {
  if (f.state && p.state !== f.state) return false;
  if (f.district && p.district !== f.district) return false;
  return true;
}
