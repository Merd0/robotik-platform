import type { Metadata } from "next";
import Link from "next/link";
import { EvidenceJsonReader } from "@/components/tools/EvidenceJsonReader";

export const metadata: Metadata = {
  title: "Kanıt JSON Okuyucu",
  description: "Kendi tarayıcından dışa aktardığın deney kaydını aç; şema, ders sürümü ve predicate durumunu kontrol et. Hiçbir şey sunucuya gönderilmez.",
};

export default function KanitOkuyucuPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="flex items-center gap-2 text-sm text-site-muted">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">
            Ana sayfa
          </Link>
          <span aria-hidden="true">/</span> Kanıt okuyucu
        </nav>
        <header className="mt-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Yerel araç</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-site-ink sm:text-4xl">
            Kendi kanıt dosyanı oku.
          </h1>
          <p className="mt-4 text-base leading-7 text-site-muted">
            Bir ders sayfasında “Kaydı dışa aktar” ile indirdiğin JSON dosyasını buraya sürükle. Şemasını, hangi
            derse ait olduğunu, ders sürümünün hâlâ güncel olup olmadığını ve hangi becerilerin gerçekten
            kanıtlandığını gösterir.
          </p>
        </header>
        <div className="mt-10">
          <EvidenceJsonReader />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-site-subtle">
          Dosyanın içeriği yalnız bu sekmede, tarayıcında işlenir — hiçbir yere yüklenmez veya gönderilmez. Ağa giden
          tek istek, dosyayla ilgisiz, derleme zamanında üretilen statik bir ders-sürüm listesidir.
        </p>
      </div>
    </main>
  );
}
