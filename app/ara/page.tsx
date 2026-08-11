import type { Metadata } from "next";
import Link from "next/link";
import { AramaKutusu } from "@/components/ui/AramaKutusu";

export const metadata: Metadata = {
  title: "Ara — Robotik Öğrenme Platformu",
  description: "Yayınlanan derslerde başlık ve metin araması.",
};

export default function AraPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-ortaokul-accent-text">Ara</p>
      <h1 className="mt-2 text-3xl font-semibold text-ortaokul-ink">Derslerde ara</h1>

      <div className="mt-8">
        <AramaKutusu />
      </div>

      <p className="mt-10 text-sm text-ortaokul-ink/70">
        Arama şu anda yayımdaki derslerin tamamını kapsar. Sonuçları başlık,
        kazanım ve ders metninde arayabilirsin. Terimlerin Türkçe-İngilizce
        karşılıkları için{" "}
        <Link href="/sozluk" className="text-ortaokul-accent-text underline">
          sözlüğe
        </Link>{" "}
        bakabilirsin.
      </p>
    </main>
  );
}
