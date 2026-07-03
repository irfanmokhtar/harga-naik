export interface Item {
  code: number;
  name: string;
  unit: string;
  group: string;
  category: string;
  /** number of premises with a current price */
  n: number;
}

export interface Premise {
  code: number;
  name: string;
  address: string;
  type: string;
  state: string;
  district: string;
}

/** [premise_code, price, prev_price | null, iso_date] */
export type PriceRow = [number, number, number | null, string];

export interface Trend {
  code: number;
  min: number;
  med: number;
  max: number;
  n: number;
  prevMed: number | null;
  /** % change of median vs previous window; null if sample too small */
  pct: number | null;
}

export interface Meta {
  generatedAt: string;
  latestDate: string;
  currentWindowDays: number;
  previousWindowDays: number;
  sources: string[];
  license: string;
}
