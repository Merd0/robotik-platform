import Link from "next/link";
import { getAllLessons, SEVIYE_ETIKET, type Seviye } from "@/lib/content";

const SEVIYELER: { seviye: Seviye; aciklama: string }[] = [
  { seviye: "ortaokul", aciklama: "Görsel, sezgisel, matematiksiz. \"Vay be\" hissi." },
  { seviye: "lise", aciklama: "Trigonometri ve vektörle bağ kurma, basit Python." },
  { seviye: "universite", aciklama: "Matris, DH, Jacobian, gerçek protokoller." },
];

export default function HomePage() {
  const publishedLessons = getAllLessons().filter((lesson) => lesson.frontmatter.durum === "yayinda");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold text-ortaokul-ink">Robotik Öğrenme Platformu</h1>
        <p className="text-ortaokul-ink/80">
          Robotiği tarayıcıda oynayarak öğreten, ortaokuldan mühendis seviyesine kadar
          kademeli ilerleyen, açık ve ücretsiz bir Türkçe kaynak.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SEVIYELER.map(({ seviye, aciklama }) => (
          <Link
            key={seviye}
            href={`/seviye/${seviye}`}
            className="flex flex-col gap-1 rounded-lg border border-ortaokul-ink/10 p-4 hover:border-ortaokul-accent"
          >
            <span className="font-medium text-ortaokul-ink">{SEVIYE_ETIKET[seviye]}</span>
            <span className="text-sm text-ortaokul-ink/60">{aciklama}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-ortaokul-ink">Yayınlanan dersler</h2>
        {publishedLessons.length === 0 ? (
          <p className="text-ortaokul-ink/60">
            Henüz insan gözden geçirmesinden geçmiş ders yok — içerik hazırlanıyor
            (bkz. docs/06-kalite-ve-topluluk.md).
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {publishedLessons.map((lesson) => (
              <li key={lesson.slug}>
                <Link
                  href={`/ders/${lesson.slug}`}
                  className="text-ortaokul-accent underline decoration-2 underline-offset-4"
                >
                  {lesson.frontmatter.baslik}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
