import items from "@/public/data/items.json";
import trends from "@/public/data/trends.json";
import meta from "@/public/data/meta.json";
import HomeClient from "@/components/HomeClient";
import type { Item, Trend, Meta } from "@/lib/types";

export default function Home() {
  return (
    <HomeClient
      items={items as Item[]}
      trends={trends as Trend[]}
      meta={meta as Meta}
    />
  );
}
