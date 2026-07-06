"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useBasket } from "@/lib/useData";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header({ latestDate }: { latestDate: string }) {
  const { lang, setLang, t } = useLang();
  const { codes } = useBasket();

  const navCls =
    "hover:text-accent whitespace-nowrap py-2 text-[11px] tracking-[0.14em] uppercase";

  return (
    <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur-sm border-b-2 border-ink">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        <Link
          href="/"
          className="shrink-0 leading-none font-display font-semibold text-[22px] tracking-tight"
        >
          HargaNaikKe
        </Link>
        <div className="hidden sm:block text-[11px] tracking-[0.14em] uppercase text-dim truncate">
          {t("asOf")} {latestDate}
        </div>
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link href="/banding" className={navCls}>
            {t("navBanding")}
          </Link>
          <Link href="/bakul" className={navCls}>
            {t("basketShort")}
            {codes.length > 0 && (
              <span className="text-accent"> {codes.length}</span>
            )}
          </Link>
          <button
            onClick={() => setLang(lang === "ms" ? "en" : "ms")}
            className="py-2 text-[11px] tracking-[0.14em] uppercase text-dim cursor-pointer"
            aria-label="Tukar bahasa / switch language"
          >
            <span className={lang === "ms" ? "text-ink" : ""}>BM</span>
            <span className="text-faint">/</span>
            <span className={lang === "en" ? "text-ink" : ""}>EN</span>
          </button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
