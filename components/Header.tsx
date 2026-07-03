"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useBasket } from "@/lib/useData";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header({ latestDate }: { latestDate: string }) {
  const { lang, setLang, t } = useLang();
  const { codes } = useBasket();

  return (
    <header className="border-b border-hairline sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0 leading-none">
          <span className="text-acid font-bold tracking-tight">HARGA</span>
          <span className="font-bold tracking-tight">NAIK</span>
          <span className="text-faint">_</span>
        </Link>
        <div className="hidden sm:block text-[11px] text-dim truncate">
          {t("asOf")} {latestDate}
        </div>
        <nav className="flex items-center gap-4 text-[13px]">
          <Link
            href="/bakul"
            className="hover:text-acid whitespace-nowrap"
          >
            {t("basket")}
            {codes.length > 0 && (
              <span className="text-acid"> [{codes.length}]</span>
            )}
          </Link>
          <button
            onClick={() => setLang(lang === "ms" ? "en" : "ms")}
            className="border border-hairline px-2 py-0.5 text-[11px] text-dim hover:text-ink hover:border-dim cursor-pointer"
            aria-label="Tukar bahasa / switch language"
          >
            <span className={lang === "ms" ? "text-acid" : ""}>BM</span>
            <span className="text-faint">/</span>
            <span className={lang === "en" ? "text-acid" : ""}>EN</span>
          </button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
