import type { Metadata } from "next";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
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
    description: "Tahmin et, robotu çalıştır, farkı gör ve öğrendiğini kanıtla.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">
        <a href="#ana-icerik" className="sr-only z-[100] rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Ana içeriğe geç</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
