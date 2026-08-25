import type { Metadata } from "next";
import Link from "next/link";
import { ErrorMuseum } from "@/components/lab/ErrorMuseum";

export const metadata: Metadata = {
  title: "Hata Müzesi — robot arızalarında yanlış ve doğru iz okuma",
  description: "Encoder ofseti, paket gecikmesi ve aktüatör doygunluğu izlerini yanlış zihinsel modellerle karşılaştır; doğru yorumu ayırt eden ölçümü bul.",
};

export default function ErrorMuseumPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
          <Link href="/laboratuvar" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvarlar</Link>
          <span aria-hidden="true">/</span>
          Hata Müzesi
        </nav>
        <header className="mt-8 max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Karşı örnek arşivi · güvenli teşhis</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Aynı izi iki kez oku: önce cazip hata, sonra ayırt eden kanıt.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-site-muted">Üç deterministik arıza izi, sık yapılan yanlış yorumları neden ikna edici bulduğumuzu gösterir. Kök nedeni açmak için ezber değil, yanlış modeli çürüten ölçüm gerekir.</p>
        </header>
        <div className="mt-10"><ErrorMuseum /></div>
      </div>
    </main>
  );
}
