"use client";

// Item-page weekly trend: national median line over a min–max band.
// Single series → no legend; crosshair + tooltip; ← → keys walk weeks.

import { useMemo, useState } from "react";
import type { HistWeek } from "@/lib/types";
import { useLang, type Lang } from "@/lib/i18n";
import { rm } from "@/lib/format";

const W = 640;
const H = 190;
const PAD = { t: 10, r: 14, b: 26, l: 48 };

function fmtWeek(iso: string, lang: Lang): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(
    lang === "ms" ? "ms-MY" : "en-MY",
    { day: "numeric", month: "short" }
  );
}

export default function TrendChart({ hist }: { hist: HistWeek[] }) {
  const { t, lang } = useLang();
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    if (hist.length < 2) return null;
    const lo = Math.min(...hist.map((w) => w[1]));
    const hi = Math.max(...hist.map((w) => w[3]));
    const span = hi - lo || 1;
    const x = (i: number) =>
      PAD.l + (i / (hist.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) =>
      PAD.t + (1 - (v - lo) / span) * (H - PAD.t - PAD.b);
    const line = hist
      .map((w, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(w[2]).toFixed(1)}`)
      .join(" ");
    const band =
      hist
        .map(
          (w, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(w[3]).toFixed(1)}`
        )
        .join(" ") +
      [...hist]
        .reverse()
        .map(
          (w, i) =>
            `L${x(hist.length - 1 - i).toFixed(1)} ${y(w[1]).toFixed(1)}`
        )
        .join(" ") +
      "Z";
    return { lo, hi, x, y, line, band };
  }, [hist]);

  if (!geo) return null;
  const { lo, hi, x, y, line, band } = geo;
  const li = hist.length - 1;
  const mid = (lo + hi) / 2;

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const fx = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((fx - PAD.l) / (W - PAD.l - PAD.r)) * li);
    setHover(Math.max(0, Math.min(li, i)));
  };
  const onKey = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowLeft") {
      setHover((h) => Math.max(0, (h ?? li) - 1));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setHover((h) => Math.min(li, (h ?? 0) + 1));
      e.preventDefault();
    } else if (e.key === "Escape") {
      setHover(null);
    }
  };

  const hovered = hover !== null ? hist[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block touch-none cursor-crosshair outline-none focus-visible:ring-1 focus-visible:ring-accent"
        role="img"
        aria-label={`${t("trendTitle")}: ${rm(hist[0][2])} → ${rm(hist[li][2])}`}
        tabIndex={0}
        onPointerMove={pick}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        {[lo, mid, hi].map((v) => (
          <g key={v}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-hairline)"
              strokeWidth="1"
            />
            <text
              x={PAD.l - 8}
              y={y(v) + 3.5}
              textAnchor="end"
              className="fill-faint font-mono"
              fontSize="10"
            >
              {rm(v)}
            </text>
          </g>
        ))}
        <path d={band} fill="var(--color-ink)" opacity="0.08" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={x(li)}
          cy={y(hist[li][2])}
          r="4"
          fill="var(--color-ink)"
          stroke="var(--color-bg)"
          strokeWidth="2"
          paintOrder="stroke"
        />
        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="var(--color-faint)"
              strokeWidth="1"
            />
            <circle
              cx={x(hover)}
              cy={y(hist[hover][2])}
              r="4"
              fill="var(--color-ink)"
              stroke="var(--color-bg)"
              strokeWidth="2"
              paintOrder="stroke"
            />
          </g>
        )}
        <text
          x={PAD.l}
          y={H - 8}
          className="fill-faint font-mono"
          fontSize="10"
        >
          {fmtWeek(hist[0][0], lang)}
        </text>
        <text
          x={W - PAD.r}
          y={H - 8}
          textAnchor="end"
          className="fill-faint font-mono"
          fontSize="10"
        >
          {fmtWeek(hist[li][0], lang)}
        </text>
      </svg>
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 bg-bg border border-hairline px-2.5 py-1.5 text-[11px]"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <div className="font-mono text-ink text-[13px]">{rm(hovered[2])}</div>
          <div className="text-dim whitespace-nowrap">
            {rm(hovered[1])}–{rm(hovered[3])} · {fmtWeek(hovered[0], lang)}
          </div>
        </div>
      )}
    </div>
  );
}
