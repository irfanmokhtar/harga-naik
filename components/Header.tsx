"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useBasket } from "@/lib/useData";
import ThemeToggle from "@/components/ThemeToggle";

function CompareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="3 3 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 8h15M15 4l4 4-4 4" />
      <path d="M20 16H5M9 12l-4 4 4 4" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export default function Header({ latestDate }: { latestDate: string }) {
  const { lang, setLang, t } = useLang();
  const { codes } = useBasket();

  return (
    <header className="border-b border-hairline sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="shrink-0 leading-none">
          <span className="text-acid font-bold tracking-tight">Harga</span>
          <span className="font-bold tracking-tight">Naik</span>
          <span className="text-acid font-bold tracking-tight">Ke</span>
          <span className="text-faint">_</span>
        </Link>
        <div className="hidden sm:block text-[11px] text-dim truncate">
          {t("asOf")} {latestDate}
        </div>
        <nav className="flex items-center gap-3 sm:gap-4 text-[13px]">
          <Link
            href="/banding"
            className="hover:text-acid whitespace-nowrap py-2 inline-flex items-center gap-1"
          >
            <CompareIcon className="w-3.5 h-3.5 shrink-0" />
            {t("navBanding")}
          </Link>
          <Link
            href="/bakul"
            className="hover:text-acid whitespace-nowrap py-2 inline-flex items-center gap-1"
          >
            <CartIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">{t("basketShort")}</span>
            <span className="hidden sm:inline">{t("basket")}</span>
            {codes.length > 0 && (
              <span className="text-acid"> [{codes.length}]</span>
            )}
          </Link>
          <button
            onClick={() => setLang(lang === "ms" ? "en" : "ms")}
            className="border border-hairline px-2 py-1.5 sm:py-0.5 text-[11px] text-dim hover:text-ink hover:border-dim cursor-pointer"
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
