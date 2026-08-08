import type { Metadata } from "next";
import Link from "next/link";
import { hatEtiket } from "@/lib/content";
import { getSozluk, getSozlukByHat } from "@/lib/sozluk";

export const metadata: Metadata = {
  title: "Sözlük — Robotik Öğrenme Platformu",
  description:
    "Robotik terimlerinin Türkçe-İngilizce karşılıkları, anlaşılır tanımları ve kısa örnekleri, konu hatlarına göre.",
};

export default function SozlukPage() {
  const gruplar = getSozlukByHat();
  const toplam = getSozluk().length;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-ortaokul-accent-text">Sözlük</p>
      <h1 className="mt-2 text-3xl font-semibold text-ortaokul-ink">
        Terimlerin Türkçe-İngilizce karşılıkları
      </h1>
      <p className="mt-4 text-ortaokul-ink/80">
        Sektörde İngilizce konuşuluyor, o yüzden her terimin ikisini de bilmen
        gerekiyor. Aşağıda {toplam} terim, geçtiği konu hattına göre gruplu.
        Soyut kavramlarda tanımın ardından kısa bir örnek veya karıştırılan
        terimden farkı da var.
      </p>

      <nav aria-label="Konu hatları" className="mt-8 flex flex-wrap gap-2">
        {gruplar.map(({ hat }) => (
          <a
            key={hat}
            href={`#${hat}`}
            className="rounded-full border border-ortaokul-ink/15 px-3 py-2 text-sm text-ortaokul-ink/80 hover:border-ortaokul-accent"
          >
            {hatEtiket(hat)}
          </a>
        ))}
      </nav>

      <div className="mt-10 flex flex-col gap-10">
        {gruplar.map(({ hat, terimler }) => (
          <section key={hat} id={hat} className="scroll-mt-6">
            <h2 className="text-lg font-medium text-ortaokul-ink">{hatEtiket(hat)}</h2>
            <dl className="mt-4 flex flex-col gap-4">
              {terimler.map((terim) => (
                <div key={`${hat}-${terim.tr}`} className="border-t border-ortaokul-ink/10 pt-4">
                  <dt className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-ortaokul-ink">{terim.tr}</span>
                    <span lang="en" className="font-mono text-sm text-ortaokul-ink/70">
                      {terim.en}
                    </span>
                  </dt>
                  <dd className="mt-1 text-sm text-ortaokul-ink/80">{terim.tanim}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-ortaokul-ink/70">
        Bir terimin geçtiği dersleri bulmak için{" "}
        <Link href="/ara" className="text-ortaokul-accent-text underline">
          aramayı
        </Link>{" "}
        kullanabilirsin. Eksik bir terim varsa sözlük{" "}
        <code className="font-mono">content/sozluk.json</code> dosyasında veri
        olarak duruyor — katkı için CONTRIBUTING.md.
      </p>
    </main>
  );
}
