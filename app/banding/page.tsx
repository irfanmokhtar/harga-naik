import { Suspense } from "react";
import items from "@/public/data/items.json";
import meta from "@/public/data/meta.json";
import CompareClient from "@/components/CompareClient";
import type { Item, Meta } from "@/lib/types";

export default function BandingPage() {
  return (
    <Suspense>
      <CompareClient items={items as Item[]} meta={meta as Meta} />
    </Suspense>
  );
}
