import { notFound } from "next/navigation";
import items from "@/public/data/items.json";
import trends from "@/public/data/trends.json";
import meta from "@/public/data/meta.json";
import ItemClient from "@/components/ItemClient";
import type { Item, Meta, Trend } from "@/lib/types";

export function generateStaticParams() {
  return (items as Item[]).map((i) => ({ code: String(i.code) }));
}

export const dynamicParams = false;

export default async function ItemPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const item = (items as Item[]).find((i) => i.code === Number(code));
  if (!item) notFound();
  const trend =
    (trends as Trend[]).find((t) => t.code === item.code) ?? null;
  return <ItemClient item={item} trend={trend} meta={meta as Meta} />;
}
