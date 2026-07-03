import type { Item } from "./types";

// PriceCatcher item names are Bahasa Melayu only. These aliases let English
// queries hit common staples; matches are also run against name + category.
const EN_ALIASES: Record<string, string[]> = {
  ayam: ["chicken"],
  telur: ["egg", "eggs"],
  daging: ["beef", "meat", "mutton", "lamb"],
  ikan: ["fish"],
  udang: ["prawn", "shrimp"],
  sotong: ["squid"],
  ketam: ["crab"],
  "minyak masak": ["cooking oil", "oil"],
  gula: ["sugar"],
  beras: ["rice"],
  tepung: ["flour"],
  susu: ["milk"],
  roti: ["bread"],
  bawang: ["onion", "garlic", "shallot"],
  cili: ["chili", "chilli", "pepper"],
  timun: ["cucumber"],
  tomato: ["tomato"],
  kentang: ["potato"],
  kobis: ["cabbage"],
  kubis: ["cabbage", "cauliflower"],
  sawi: ["mustard greens", "choy"],
  kangkung: ["water spinach"],
  bayam: ["spinach"],
  kacang: ["bean", "beans", "nut", "peanut"],
  pisang: ["banana"],
  epal: ["apple"],
  oren: ["orange"],
  limau: ["lime", "lemon"],
  anggur: ["grape", "grapes"],
  betik: ["papaya"],
  santan: ["coconut milk"],
  kelapa: ["coconut"],
  garam: ["salt"],
  kicap: ["soy sauce"],
  sos: ["sauce"],
  mi: ["noodle", "noodles", "mee"],
  bihun: ["vermicelli"],
  tauhu: ["tofu"],
  taugeh: ["bean sprout"],
  halia: ["ginger"],
  serai: ["lemongrass"],
  kopi: ["coffee"],
  teh: ["tea"],
  milo: ["milo"],
  mentega: ["butter"],
  keju: ["cheese"],
};

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s]/g, " ");
}

/** Search items by BM name, category, group, or English alias. */
export function searchItems(items: Item[], query: string): Item[] {
  const q = normalize(query).trim();
  if (!q) return [];
  const terms = q.split(/\s+/);

  // expand english terms to BM stems
  const expanded = new Set<string>(terms);
  for (const [bm, ens] of Object.entries(EN_ALIASES)) {
    if (ens.some((en) => terms.some((t) => en.startsWith(t) && t.length >= 3))) {
      for (const w of bm.split(" ")) expanded.add(w);
    }
  }

  const scored: Array<[number, Item]> = [];
  for (const item of items) {
    const hay = normalize(`${item.name} ${item.category} ${item.group}`);
    let score = 0;
    for (const term of expanded) {
      if (hay.includes(term)) score += term.length >= 4 ? 2 : 1;
    }
    if (normalize(item.name).startsWith(q)) score += 4;
    if (score > 0) scored.push([score, item]);
  }
  scored.sort((a, b) => b[0] - a[0] || b[1].n - a[1].n);
  return scored.map(([, item]) => item);
}
