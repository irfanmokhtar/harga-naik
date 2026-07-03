import items from "@/public/data/items.json";
import meta from "@/public/data/meta.json";
import BasketClient from "@/components/BasketClient";
import type { Item, Meta } from "@/lib/types";

export default function BakulPage() {
  return <BasketClient items={items as Item[]} meta={meta as Meta} />;
}
