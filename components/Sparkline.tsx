// 12-week inline sparkline for board rows. Decorative (aria-hidden):
// the row's price + pct carry the accessible values.
export default function Sparkline({
  data,
  pct,
}: {
  data: number[];
  pct: number | null;
}) {
  const W = 64;
  const H = 20;
  if (!data || data.length < 2)
    return <span className="inline-block w-16 shrink-0" aria-hidden="true" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const px = (i: number) => 3 + (i / (data.length - 1)) * (W - 8);
  const py = (v: number) => H - 4 - ((v - min) / span) * (H - 8);
  const pts = data
    .map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`)
    .join(" ");
  const li = data.length - 1;
  const endCls =
    pct !== null && pct > 0.05
      ? "text-naik"
      : pct !== null && pct < -0.05
        ? "text-turun"
        : "text-faint";
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="shrink-0 w-16 h-5"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="var(--color-faint)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={px(li)}
        cy={py(data[li])}
        r="2.5"
        fill="currentColor"
        stroke="var(--color-bg)"
        strokeWidth="2"
        paintOrder="stroke"
        className={endCls}
      />
    </svg>
  );
}
