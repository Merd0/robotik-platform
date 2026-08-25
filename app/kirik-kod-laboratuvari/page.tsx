import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import { BrokenCodeLab } from "@/components/lab/BrokenCodeLab";

export const metadata: Metadata = createPageMetadata({
  title: "Kırık Kod Laboratuvarı",
  description: "Gerçek, çalışan robot kodundaki yaygın hataları bul ve düzelt — her düzeltme gerçek Pyodide çalıştırmasıyla doğrulanır.",
  path: "/kirik-kod-laboratuvari",
});

export default function KirikKodLaboratuvariPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-site-muted"><Link href="/laboratuvar" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvarlar</Link> <span aria-hidden="true">/</span> Kırık Kod Laboratuvarı</nav>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Serbest deney</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Kırık Kod Laboratuvarı</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-site-muted">
          Kod Akademisi&apos;nin sıralı dersleri değil — bağımsız bir arıza galerisi. İstediğin kartı seç, robotun
          neden yanlış yere gittiğini bul, düzelt. Her düzeltme gerçek Pyodide çalıştırmasıyla doğrulanıyor.
        </p>

        <div className="mt-8">
          <BrokenCodeLab />
        </div>
      </div>
    </main>
  );
}
