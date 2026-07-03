"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ms" | "en";

const STRINGS = {
  ms: {
    tagline: "Papan pantau harga barang keperluan Malaysia",
    searchPlaceholder: "Cari barang… (cth: ayam, telur, minyak masak)",
    search: "Carian",
    barangNaik: "Barang Naik",
    barangTurun: "Barang Turun",
    boardSub: "Perubahan harga penengah berbanding tempoh sebelumnya",
    allItems: "Semua Barang",
    basket: "Bakul Saya",
    basketShort: "Bakul",
    item: "Barang",
    price: "Harga",
    median: "Penengah",
    cheapest: "Termurah",
    highest: "Tertinggi",
    change: "Ubah",
    premise: "Premis",
    premises: "premis",
    state: "Negeri",
    district: "Daerah",
    allStates: "Semua negeri",
    allDistricts: "Semua daerah",
    noData: "Tiada data",
    naik: "NAIK",
    turun: "TURUN",
    same: "SAMA",
    unit: "Unit",
    perUnit: "seunit",
    asOf: "Data sehingga",
    addToBasket: "+ Bakul",
    inBasket: "Dalam bakul",
    removeFromBasket: "Buang",
    emptyBasket: "Bakul kosong. Cari barang dan tambah ke bakul.",
    basketTotal: "Jumlah bakul",
    basketCheapest: "Premis paling jimat untuk seluruh bakul",
    coverage: "barang tersedia",
    share: "Kongsi",
    shareWhatsApp: "Kongsi ke WhatsApp",
    downloadCard: "Muat turun kad",
    priceSpread: "Taburan harga semasa",
    vsPrev: "vs tempoh sebelum",
    prevPrice: "Sebelum",
    date: "Tarikh",
    showAll: "Papar semua",
    showLess: "Papar kurang",
    results: "hasil",
    sourceNote:
      "Sumber: PriceCatcher, KPDN & DOSM (data.gov.my), lesen CC BY 4.0.",
    cpiNote:
      "Data ini untuk pemantauan harga, bukan ukuran inflasi. Rujuk data CPI rasmi DOSM untuk inflasi.",
    backHome: "← Kembali",
    searchHint: "Taip untuk cari — BM atau English",
    notEnoughData: "Sampel kecil — tiada perbandingan",
    loading: "Memuatkan…",
    itemsTracked: "barang dipantau",
    premisesTracked: "premis di seluruh negara",
    typeFilter: "Jenis premis",
    allTypes: "Semua jenis",
    top: "NAIK PALING BANYAK",
    bottom: "TURUN PALING BANYAK",
    copied: "Disalin!",
    copyText: "Salin teks",
  },
  en: {
    tagline: "Malaysia's grocery price watch board",
    searchPlaceholder: "Search items… (e.g. ayam, telur, cooking oil)",
    search: "Search",
    barangNaik: "Price Risers",
    barangTurun: "Price Fallers",
    boardSub: "Median price change vs the previous period",
    allItems: "All Items",
    basket: "My Basket",
    basketShort: "Basket",
    item: "Item",
    price: "Price",
    median: "Median",
    cheapest: "Cheapest",
    highest: "Highest",
    change: "Chg",
    premise: "Premise",
    premises: "premises",
    state: "State",
    district: "District",
    allStates: "All states",
    allDistricts: "All districts",
    noData: "No data",
    naik: "UP",
    turun: "DOWN",
    same: "FLAT",
    unit: "Unit",
    perUnit: "per unit",
    asOf: "Data as of",
    addToBasket: "+ Basket",
    inBasket: "In basket",
    removeFromBasket: "Remove",
    emptyBasket: "Basket is empty. Search for items and add them.",
    basketTotal: "Basket total",
    basketCheapest: "Cheapest premise for the whole basket",
    coverage: "items available",
    share: "Share",
    shareWhatsApp: "Share to WhatsApp",
    downloadCard: "Download card",
    priceSpread: "Current price spread",
    vsPrev: "vs previous period",
    prevPrice: "Prev",
    date: "Date",
    showAll: "Show all",
    showLess: "Show less",
    results: "results",
    sourceNote:
      "Source: PriceCatcher, KPDN & DOSM (data.gov.my), CC BY 4.0 licence.",
    cpiNote:
      "This data is for price surveillance, not inflation measurement. Refer to DOSM's official CPI data for inflation.",
    backHome: "← Back",
    searchHint: "Type to search — BM or English",
    notEnoughData: "Small sample — no comparison",
    loading: "Loading…",
    itemsTracked: "items tracked",
    premisesTracked: "premises nationwide",
    typeFilter: "Premise type",
    allTypes: "All types",
    top: "BIGGEST RISERS",
    bottom: "BIGGEST FALLERS",
    copied: "Copied!",
    copyText: "Copy text",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["ms"];

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: StringKey) => string;
}>({ lang: "ms", setLang: () => {}, t: (k) => STRINGS.ms[k] });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ms");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "ms") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (k: StringKey) => STRINGS[lang][k];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
