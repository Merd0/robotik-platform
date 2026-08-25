import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, learningResourceJsonLd } from "@/lib/seo";
import Link from "next/link";
import { DigitalTwinDriftLab } from "@/components/lab/DigitalTwinDriftLab";

export const metadata: Metadata = createPageMetadata({
  title: "Dijital ikiz kayması — model ile ölçümü yeniden eşleştir",
  description: "İkiz tahmini ile sentetik fiziksel TCP ölçümünün artık hatasını izle; kalıcı kaymayı teşhis et, modeli yeniden kalibre edip ayrı pozlarda doğrula.",
  path: "/laboratuvar/dijital-ikiz-kaymasi",
});

export default function DigitalTwinDriftPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <JsonLd data={learningResourceJsonLd({ name: "Dijital ikiz kayması", description: "İkiz tahmini ile sentetik fiziksel TCP ölçümünün artık hatasını izle; kalıcı kaymayı teşhis et, modeli yeniden kalibre edip ayrı pozlarda doğrula.", path: "/laboratuvar/dijital-ikiz-kaymasi", learningResourceType: "Etkileşimli laboratuvar" })} />
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
          <Link href="/laboratuvar" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvarlar</Link>
          <span aria-hidden="true">/</span>
          Dijital ikiz kayması
        </nav>
        <header className="mt-8 max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Tahmin · ölçüm · artık · doğrulama</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Bağlı olmak, senkron kalmak demek değildir.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-site-muted">Bir model fiziksel sistemden veri almaya devam ederken de eskimeye başlayabilir. Artık hatayı ölç, kalıcı kaymayı tek bir aykırı değerden ayır ve düzeltmenin yeni pozlara taşındığını kanıtla.</p>
        </header>
        <div className="mt-10"><DigitalTwinDriftLab /></div>
      </div>
    </main>
  );
}
