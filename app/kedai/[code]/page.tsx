import { notFound } from "next/navigation";
import premises from "@/public/data/premises.json";
import shopStats from "@/public/data/shops-index.json";
import items from "@/public/data/items.json";
import trends from "@/public/data/trends.json";
import meta from "@/public/data/meta.json";
import ShopClient from "@/components/ShopClient";
import type { Item, Meta, Premise, ShopStat, Trend } from "@/lib/types";

export function generateStaticParams() {
  return (premises as Premise[]).map((p) => ({ code: String(p.code) }));
}

export const dynamicParams = false;

export default async function ShopPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const premise = (premises as Premise[]).find(
    (p) => p.code === Number(code)
  );
  if (!premise) notFound();
  const stat =
    (shopStats as ShopStat[]).find((s) => s.code === premise.code) ?? null;
  return (
    <ShopClient
      premise={premise}
      stat={stat}
      items={items as Item[]}
      trends={trends as Trend[]}
      meta={meta as Meta}
    />
  );
}
