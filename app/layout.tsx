import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import meta from "@/public/data/meta.json";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "HARGA NAIK — papan harga barang Malaysia",
  description:
    "Semak harga barang keperluan di seluruh Malaysia. Data PriceCatcher KPDN & DOSM.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms" className={jetbrains.variable}>
      <body className="min-h-screen bg-bg text-ink flex flex-col">
        <LangProvider>
          <Header latestDate={meta.latestDate} />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-16">
            {children}
          </main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
