import type { Metadata } from "next";
import Link from "next/link";
import { hatEtiket } from "@/lib/content";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/seo";
import { getSozluk, getSozlukByHat, terimSlug } from "@/lib/sozluk";

export const metadata: Metadata = {
  title: "Robotik sözlüğü",
  description:
    "Robotik terimlerinin Türkçe-İngilizce karşılıkları, anlaşılır tanımları ve kısa örnekleri, konu hatlarına göre.",
  alternates: { canonical: "/sozluk" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/sozluk`,
    title: "Robotik sözlüğü",
    description: "Robotik terimlerinin Türkçe-İngilizce karşılıkları ve anlaşılır tanımları.",
  },
};

export default function SozlukPage() {
  const gruplar = getSozlukByHat();
  const terimler = getSozluk();
  const toplam = terimler.length;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${SITE_URL}/sozluk`,
    url: `${SITE_URL}/sozluk`,
    name: "Robotik sözlüğü",
    inLanguage: "tr",
    hasDefinedTerm: terimler.map((terim) => ({
      "@type": "DefinedTerm",
      "@id": `${SITE_URL}/sozluk/${terimSlug(terim.tr)}`,
      name: terim.tr,
    })),
  };

  return (
    <main id="ana-icerik" className="mx-auto max-w-2xl px-6 py-16">
      <JsonLd data={jsonLd} />
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

      <Link
        href="/bilgi-haritasi"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-ortaokul-accent/40 bg-ortaokul-surface px-4 font-medium text-ortaokul-accent-text hover:border-ortaokul-accent"
      >
        Bu terimlerin ders ve laboratuvar bağlantılarını haritada gör →
      </Link>

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
                    <Link
                      href={`/sozluk/${terimSlug(terim.tr)}`}
                      className="font-medium text-ortaokul-accent-text underline decoration-ortaokul-accent/40 underline-offset-4 hover:decoration-ortaokul-accent"
                    >
                      {terim.tr}
                    </Link>
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
