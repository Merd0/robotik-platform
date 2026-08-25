import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { BoundaryTest } from "@/components/lab/BoundaryTest";

export const metadata: Metadata = createPageMetadata({
  title: "Sınır Testi",
  description: "Bir hedefin robot kolunun çalışma uzayına girip girmediğini tahmin et; gerçek cevap analitik ters kinematikle hesaplanır.",
  path: "/sinir-testi",
});

export default function SinirTestiPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Serbest deney</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Sınır Testi</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-site-muted">
          Her round&apos;da bir hedef noktası görürsün. Robot kolu oraya ulaşabilir mi, ulaşamaz mı? Önce tahmin et,
          sonra gerçek cevabı gör — cevap önceden yazılmış değil, o an gerçek ters kinematik hesabından geliyor.
        </p>

        <div className="mt-8">
          <BoundaryTest />
        </div>
      </div>
    </main>
  );
}
