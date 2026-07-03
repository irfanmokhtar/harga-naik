export function rm(v: number): string {
  return `RM${v.toFixed(2)}`;
}

export function pctStr(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** naik = price went up (bad, red); turun = went down (good, lime). */
export function moveClass(pct: number | null): string {
  if (pct === null || Math.abs(pct) < 0.05) return "text-dim";
  return pct > 0 ? "text-naik" : "text-turun";
}

export function moveArrow(pct: number | null): string {
  if (pct === null || Math.abs(pct) < 0.05) return "·";
  return pct > 0 ? "▲" : "▼";
}

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s(/-])\p{L}/gu, (c) => c.toUpperCase());
}
