import type { Metadata } from "next";
import Script from "next/script";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://robotik-platform.vercel.app"),
  title: { default: "Robotik Laboratuvarı", template: "%s · Robotik Laboratuvarı" },
  description:
    "Robotiği tarayıcıda oynayarak öğreten, ortaokuldan mühendis seviyesine kadar kademeli ilerleyen, açık ve ücretsiz bir Türkçe kaynak.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    title: "Robotik Laboratuvarı",
    description: "Tahmin et, robotu çalıştır, farkı gör ve seçili görevlerde öğrendiğini kanıtla.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/*
          Yalnız ilk ekranda görünen font dosyası preload edilir. Kalan üç
          alt küme (latin-ext ve mono) tarayıcı ilgili glifi isteyince
          çekilir — dördünü birden preload etmek ilk boyamayı yavaşlatırdı.
          Ayrıntı ve ölçüm: public/fonts/LISANS.md
        */}
        <link rel="preload" href="/fonts/big-shoulders-display-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen bg-site-bg text-site-ink antialiased">
        <ThemeProvider>
          <a href="#ana-icerik" className="sr-only z-[100] rounded bg-site-surface p-3 text-site-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Ana içeriğe geç</a>
          <SiteHeader />
          {children}
          <SiteFooter />
          <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  );
}
