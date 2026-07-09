"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useBasket } from "@/lib/useData";
import ThemeToggle from "@/components/ThemeToggle";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
}

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
          <Link
            href="/bakul"
            className={`${navCls} inline-flex items-center gap-1`}
            aria-label={t("basketShort")}
          >
            <CartIcon className="w-4 h-4 shrink-0" />
            {codes.length > 0 && (
              <span className="text-accent">{codes.length}</span>
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
