import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import meta from "@/public/data/meta.json";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "HargaNaikKe — papan harga barang Malaysia",
  description:
    "Semak harga barang keperluan di seluruh Malaysia. Data PriceCatcher KPDN & DOSM.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ms"
      className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.theme;document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg text-ink flex flex-col">
        <LangProvider>
          <Header latestDate={meta.latestDate} />
          <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-16">
            {children}
          </main>
          <Footer meta={meta} />
        </LangProvider>
      </body>
    </html>
  );
}
