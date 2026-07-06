// Client-side canvas renderer for the WhatsApp-shareable price card.
// 1080x1080, editorial paper styling — always light, theme-independent.

const BG = "#faf7f0";
const INK = "#1c1a17";
const DIM = "#6f6a5e";
const FAINT = "#a29b8a";
const ACCENT = "#23479c";
const NAIK = "#b23a24";
const TURUN = "#1e6b4f";
const HAIRLINE = "#e3ddcf";

// next/font registers hashed family names — read the real stacks off the CSS vars
function family(varName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}
const DISPLAY = (px: number, weight = 600) =>
  `${weight} ${px}px ${family("--font-fraunces", "Georgia, serif")}`;
const SANS = (px: number, weight = 400) =>
  `${weight} ${px}px ${family("--font-inter", "system-ui, sans-serif")}`;

export interface ItemCardSpec {
  lang: "ms" | "en";
  itemName: string;
  unit: string;
  scope: string;
  min: number;
  med: number;
  max: number;
  pct: number | null;
  cheapestName: string;
  cheapestPlace: string;
  date: string;
}

const rm = (v: number) => `RM${v.toFixed(2)}`;

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawItemCard(
  spec: ItemCardSpec
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const S = 1080;
  const M = 72; // margin
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, S, S);

  // masthead
  ctx.font = DISPLAY(44, 600);
  ctx.fillStyle = INK;
  ctx.fillText("HargaNaikKe", M, M + 36);

  ctx.font = SANS(26);
  ctx.fillStyle = DIM;
  const dateLabel = `${spec.date}`;
  ctx.fillText(dateLabel, S - M - ctx.measureText(dateLabel).width, M + 34);

  // thick editorial rule
  ctx.fillStyle = INK;
  ctx.fillRect(M, M + 62, S - 2 * M, 4);

  // item name (wrapped, serif)
  ctx.font = DISPLAY(56, 600);
  ctx.fillStyle = INK;
  const nameLines = wrap(ctx, spec.itemName, S - 2 * M).slice(0, 3);
  let y = M + 160;
  for (const line of nameLines) {
    ctx.fillText(line, M, y);
    y += 68;
  }
  ctx.font = SANS(30);
  ctx.fillStyle = DIM;
  ctx.fillText(`${spec.unit} · ${spec.scope}`, M, y + 4);
  y += 92;

  // big cheapest price
  ctx.font = SANS(26, 600);
  ctx.fillStyle = FAINT;
  ctx.fillText(spec.lang === "ms" ? "TERMURAH" : "CHEAPEST", M, y);
  y += 108;
  ctx.font = DISPLAY(124, 600);
  ctx.fillStyle = ACCENT;
  ctx.fillText(rm(spec.min), M, y);
  y += 58;

  ctx.font = SANS(30);
  ctx.fillStyle = INK;
  const cheapLines = wrap(ctx, spec.cheapestName, S - 2 * M).slice(0, 2);
  for (const line of cheapLines) {
    ctx.fillText(line, M, y);
    y += 40;
  }
  ctx.fillStyle = DIM;
  ctx.fillText(spec.cheapestPlace, M, y);
  y += 74;

  // median / highest / change row
  const cols = [
    [spec.lang === "ms" ? "PENENGAH" : "MEDIAN", rm(spec.med)],
    [spec.lang === "ms" ? "TERTINGGI" : "HIGHEST", rm(spec.max)],
  ] as const;
  let x = M;
  for (const [label, value] of cols) {
    ctx.font = SANS(24, 600);
    ctx.fillStyle = FAINT;
    ctx.fillText(label, x, y);
    ctx.font = DISPLAY(44, 600);
    ctx.fillStyle = INK;
    ctx.fillText(value, x, y + 56);
    x += 300;
  }
  if (spec.pct != null) {
    const up = spec.pct > 0.05;
    const flat = Math.abs(spec.pct) <= 0.05;
    ctx.font = SANS(24, 600);
    ctx.fillStyle = FAINT;
    ctx.fillText(spec.lang === "ms" ? "VS SEBELUM" : "VS PREVIOUS", x, y);
    ctx.font = DISPLAY(44, 600);
    ctx.fillStyle = flat ? DIM : up ? NAIK : TURUN;
    const sign = spec.pct > 0 ? "+" : "";
    ctx.fillText(
      `${flat ? "·" : up ? "▲" : "▼"} ${sign}${spec.pct.toFixed(1)}%`,
      x,
      y + 56
    );
  }

  // footer
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, S - M - 56);
  ctx.lineTo(S - M, S - M - 56);
  ctx.stroke();
  ctx.font = SANS(22);
  ctx.fillStyle = FAINT;
  ctx.fillText(
    spec.lang === "ms"
      ? "Sumber: PriceCatcher, KPDN & DOSM · data.gov.my · CC BY 4.0"
      : "Source: PriceCatcher, KPDN & DOSM · data.gov.my · CC BY 4.0",
    M,
    S - M - 16
  );

  return canvas;
}
