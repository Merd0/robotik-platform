import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, learningResourceJsonLd } from "@/lib/seo";
import Link from "next/link";
import { VendorRosettaLab } from "@/components/lab/VendorRosettaLab";

export const metadata: Metadata = createPageMetadata({
  title: "Robot programlama dili karşılaştırıcı — RAPID ve Mecademic",
  description: "Aynı MoveJ ve doğrusal hareket niyetinin ABB RAPID ile Mecademic komutlarında hedef, çerçeve, hız, blend ve takım farklarını karşılaştır.",
  path: "/laboratuvar/dil-karsilastirici",
});

export default function LanguageComparatorPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <JsonLd data={learningResourceJsonLd({ name: "Robot programlama dili karşılaştırıcı", description: "Aynı MoveJ ve doğrusal hareket niyetinin ABB RAPID ile Mecademic komutlarında hedef, çerçeve, hız, blend ve takım farklarını karşılaştır.", path: "/laboratuvar/dil-karsilastirici", learningResourceType: "Etkileşimli laboratuvar" })} />
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
          <Link href="/laboratuvar" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvarlar</Link>
          <span aria-hidden="true">/</span>
          Dil karşılaştırıcı
        </nav>
        <header className="mt-8 max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Vendor Rosetta · kavramdan komuta</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Aynı hareket niyeti, aynı program demek değildir.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-site-muted">Önce marka bağımsız hedefi oku. Sonra RAPID ve Mecademic&apos;in aynı kararı hangi komut, birim ve controller durumuyla ifade ettiğini karşılaştır.</p>
        </header>
        <div className="mt-10"><VendorRosettaLab /></div>
      </div>
    </main>
  );
}
