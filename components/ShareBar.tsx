"use client";

import { useState } from "react";
import type { Item, Meta } from "@/lib/types";
import type { ScopedStats } from "@/components/ItemClient";
import type { LocationFilter } from "@/components/LocationPicker";
import { useLang } from "@/lib/i18n";
import { rm, pctStr, titleCase } from "@/lib/format";
import { drawItemCard } from "@/lib/shareCard";

export default function ShareBar({
  item,
  stats,
  loc,
  meta,
}: {
  item: Item;
  stats: ScopedStats;
  loc: LocationFilter;
  meta: Meta;
}) {
  const { lang, t } = useLang();
  const [copied, setCopied] = useState(false);

  const scopeLabel = loc.district
    ? `${loc.district}, ${loc.state}`
    : loc.state || "Malaysia";

  const buildText = () => {
    const name = titleCase(item.name);
    const move =
      stats.pct != null
        ? stats.pct > 0.05
          ? `📈 ${lang === "ms" ? "NAIK" : "UP"} ${pctStr(stats.pct)}`
          : stats.pct < -0.05
            ? `📉 ${lang === "ms" ? "TURUN" : "DOWN"} ${pctStr(stats.pct)}`
            : lang === "ms"
              ? "➖ Tidak berubah"
              : "➖ Unchanged"
        : "";
    const cheapest = stats.cheapest
      ? `${titleCase(stats.cheapest.premise.name)} (${stats.cheapest.premise.district})`
      : "";
    if (lang === "ms") {
      return [
        `*${name}* (${item.unit}) — ${scopeLabel}`,
        `💰 Termurah: ${rm(stats.min)} di ${cheapest}`,
        `Penengah: ${rm(stats.med)} · Tertinggi: ${rm(stats.max)}`,
        move,
        ``,
        `Data ${meta.latestDate} · harganaik · Sumber: PriceCatcher KPDN/DOSM (CC BY 4.0)`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    return [
      `*${name}* (${item.unit}) — ${scopeLabel}`,
      `💰 Cheapest: ${rm(stats.min)} at ${cheapest}`,
      `Median: ${rm(stats.med)} · Highest: ${rm(stats.max)}`,
      move,
      ``,
      `Data ${meta.latestDate} · harganaik · Source: PriceCatcher KPDN/DOSM (CC BY 4.0)`,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildText())}`,
      "_blank",
      "noopener"
    );
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(buildText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadCard = async () => {
    const canvas = await drawItemCard({
      lang,
      itemName: titleCase(item.name),
      unit: item.unit,
      scope: scopeLabel,
      min: stats.min,
      med: stats.med,
      max: stats.max,
      pct: stats.pct,
      cheapestName: stats.cheapest
        ? titleCase(stats.cheapest.premise.name)
        : "",
      cheapestPlace: stats.cheapest
        ? `${stats.cheapest.premise.district}, ${stats.cheapest.premise.state}`
        : "",
      date: meta.latestDate,
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `harganaik-${item.code}.png`;
    a.click();
  };

  const btn =
    "border border-hairline px-3 py-2.5 sm:py-1.5 text-[12px] text-dim hover:text-ink hover:border-dim cursor-pointer";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="text-[11px] tracking-widest text-faint uppercase mr-1">
        {t("share")}
      </span>
      <button onClick={shareWhatsApp} className={btn}>
        {t("shareWhatsApp")}
      </button>
      <button onClick={copyText} className={btn}>
        {copied ? t("copied") : t("copyText")}
      </button>
      <button onClick={downloadCard} className={btn}>
        {t("downloadCard")}
      </button>
    </div>
  );
}
