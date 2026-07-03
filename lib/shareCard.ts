// Client-side canvas renderer for the WhatsApp-shareable price card.
// 1080x1080, Technical Mono styling to match the app.

const BG = "#0a0a0a";
const INK = "#ededed";
const DIM = "#8a8a8a";
const FAINT = "#555555";
const ACID = "#c6f432";
const NAIK = "#ff5c5c";
const HAIRLINE = "#262626";

const MONO = (px: number, weight = 400) =>
  `${weight} ${px}px "JetBrains Mono", "IBM Plex Mono", monospace`;

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
  ctx.font = MONO(40, 700);
  ctx.fillStyle = ACID;
  ctx.fillText("HARGA", M, M + 36);
  const w1 = ctx.measureText("HARGA").width;
  ctx.fillStyle = INK;
  ctx.fillText("NAIK", M + w1, M + 36);
  const w2 = ctx.measureText("NAIK").width;
  ctx.fillStyle = FAINT;
  ctx.fillText("_", M + w1 + w2, M + 36);

  ctx.font = MONO(26);
  ctx.fillStyle = DIM;
  const dateLabel = `${spec.date}`;
  ctx.fillText(
    dateLabel,
    S - M - ctx.measureText(dateLabel).width,
    M + 34
  );

  // hairline
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, M + 70);
  ctx.lineTo(S - M, M + 70);
  ctx.stroke();

  // item name (wrapped)
  ctx.font = MONO(52, 700);
  ctx.fillStyle = INK;
  const nameLines = wrap(ctx, spec.itemName, S - 2 * M).slice(0, 3);
  let y = M + 160;
  for (const line of nameLines) {
    ctx.fillText(line, M, y);
    y += 64;
  }
  ctx.font = MONO(30);
  ctx.fillStyle = DIM;
  ctx.fillText(`${spec.unit} · ${spec.scope}`, M, y + 4);
  y += 90;

  // big cheapest price
  ctx.font = MONO(28);
  ctx.fillStyle = FAINT;
  ctx.fillText(
    spec.lang === "ms" ? "TERMURAH" : "CHEAPEST",
    M,
    y
  );
  y += 100;
  ctx.font = MONO(120, 700);
  ctx.fillStyle = ACID;
  ctx.fillText(rm(spec.min), M, y);
  y += 56;

  ctx.font = MONO(30);
  ctx.fillStyle = INK;
  const cheapLines = wrap(ctx, spec.cheapestName, S - 2 * M).slice(0, 2);
  for (const line of cheapLines) {
    ctx.fillText(line, M, y);
    y += 40;
  }
  ctx.fillStyle = DIM;
  ctx.fillText(spec.cheapestPlace, M, y);
  y += 70;

  // median / highest / change row
  const cols = [
    [spec.lang === "ms" ? "PENENGAH" : "MEDIAN", rm(spec.med), INK],
    [spec.lang === "ms" ? "TERTINGGI" : "HIGHEST", rm(spec.max), INK],
  ] as const;
  let x = M;
  for (const [label, value, color] of cols) {
    ctx.font = MONO(24);
    ctx.fillStyle = FAINT;
    ctx.fillText(label, x, y);
    ctx.font = MONO(44, 700);
    ctx.fillStyle = color;
    ctx.fillText(value, x, y + 54);
    x += 300;
  }
  if (spec.pct != null) {
    const up = spec.pct > 0.05;
    const flat = Math.abs(spec.pct) <= 0.05;
    ctx.font = MONO(24);
    ctx.fillStyle = FAINT;
    ctx.fillText(
      spec.lang === "ms" ? "VS SEBELUM" : "VS PREVIOUS",
      x,
      y
    );
    ctx.font = MONO(44, 700);
    ctx.fillStyle = flat ? DIM : up ? NAIK : ACID;
    const sign = spec.pct > 0 ? "+" : "";
    ctx.fillText(
      `${flat ? "·" : up ? "▲" : "▼"} ${sign}${spec.pct.toFixed(1)}%`,
      x,
      y + 54
    );
  }

  // footer
  ctx.strokeStyle = HAIRLINE;
  ctx.beginPath();
  ctx.moveTo(M, S - M - 56);
  ctx.lineTo(S - M, S - M - 56);
  ctx.stroke();
  ctx.font = MONO(22);
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
