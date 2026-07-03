"use client";

import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-hairline mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 text-[11px] text-dim space-y-2">
        <p>
          {t("sourceNote")}{" "}
          <a
            href="https://data.gov.my/data-catalogue/pricecatcher"
            className="underline hover:text-acid"
            target="_blank"
            rel="noopener noreferrer"
          >
            data.gov.my
          </a>
        </p>
        <p className="text-faint">{t("cpiNote")}</p>
      </div>
    </footer>
  );
}
