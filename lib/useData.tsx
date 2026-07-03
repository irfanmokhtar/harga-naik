"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Premise, PriceRow } from "./types";

// ---- premises (fetched once, cached module-level) ----

let premiseCache: Map<number, Premise> | null = null;
let premisePromise: Promise<Map<number, Premise>> | null = null;

export function loadPremises(): Promise<Map<number, Premise>> {
  if (premiseCache) return Promise.resolve(premiseCache);
  premisePromise ??= fetch("/data/premises.json")
    .then((r) => r.json())
    .then((list: Premise[]) => {
      premiseCache = new Map(list.map((p) => [p.code, p]));
      return premiseCache;
    });
  return premisePromise;
}

export function usePremises(): Map<number, Premise> | null {
  const [premises, setPremises] = useState<Map<number, Premise> | null>(
    premiseCache
  );
  useEffect(() => {
    if (!premises) loadPremises().then(setPremises);
  }, [premises]);
  return premises;
}

// ---- per-item prices ----

const priceCache = new Map<number, PriceRow[]>();

export function loadPrices(itemCode: number): Promise<PriceRow[]> {
  const cached = priceCache.get(itemCode);
  if (cached) return Promise.resolve(cached);
  return fetch(`/data/prices/${itemCode}.json`)
    .then((r) => (r.ok ? r.json() : []))
    .then((rows: PriceRow[]) => {
      priceCache.set(itemCode, rows);
      return rows;
    });
}

export function usePrices(itemCode: number): PriceRow[] | null {
  const [rows, setRows] = useState<PriceRow[] | null>(
    priceCache.get(itemCode) ?? null
  );
  useEffect(() => {
    let live = true;
    loadPrices(itemCode).then((r) => live && setRows(r));
    return () => {
      live = false;
    };
  }, [itemCode]);
  return rows;
}

// ---- basket (localStorage-backed, cross-component via subscribe) ----

const BASKET_KEY = "bakul";
let basketSnapshot: number[] = [];
const listeners = new Set<() => void>();

function readBasket(): number[] {
  try {
    const raw = localStorage.getItem(BASKET_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function writeBasket(codes: number[]) {
  basketSnapshot = codes;
  localStorage.setItem(BASKET_KEY, JSON.stringify(codes));
  listeners.forEach((fn) => fn());
}

let basketLoaded = false;
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function getSnapshot(): number[] {
  if (!basketLoaded && typeof window !== "undefined") {
    basketLoaded = true;
    basketSnapshot = readBasket();
  }
  return basketSnapshot;
}
const EMPTY: number[] = [];
function getServerSnapshot(): number[] {
  return EMPTY;
}

export function useBasket() {
  const codes = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    codes,
    has: (code: number) => codes.includes(code),
    add: (code: number) => {
      if (!basketSnapshot.includes(code))
        writeBasket([...basketSnapshot, code]);
    },
    remove: (code: number) =>
      writeBasket(basketSnapshot.filter((c) => c !== code)),
    clear: () => writeBasket([]),
  };
}
