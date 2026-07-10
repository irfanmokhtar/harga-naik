"use client";

import { useLang, periodLabel } from "@/lib/i18n";

export default function Footer({
  meta,
}: {
  meta: { currentWindowDays: number; previousWindowDays: number };
}) {
  const { t, lang } = useLang();
  return (
    <footer className="border-t-2 border-ink mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 text-[12px] text-dim space-y-2">
        <p className="font-display font-semibold text-ink text-base">
          Harga<span className="wordmark-naik">Naik</span>Ke
        </p>
        <p>
          {t("sourceNote")}{" "}
          <a
            href="https://data.gov.my/data-catalogue/pricecatcher"
            className="underline underline-offset-2 hover:text-accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            data.gov.my
          </a>
        </p>
        <p>
          {t("methodNote")}: {periodLabel(lang, meta)}.
        </p>
        <p className="text-faint">{t("cpiNote")}</p>
      </div>
    </footer>
  );
}
