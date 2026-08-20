import Link from "next/link";
import { terimSlug, type Terim } from "@/lib/sozluk";

/**
 * Ders sayfasından sözlüğe GERİYE DÖNÜK bağlantı (Faz 4, bkz.
 * docs/durum-denetim.md "Sözlük/SEO derinleştirme"). Önceden yalnız
 * sözlük→ders yönü vardı (`app/sozluk/[slug]/page.tsx` "İlgili dersler").
 * Hangi terimlerin gösterileceği elle seçilmez — `lib/sozluk.ts`teki
 * `getSeoAnchorTermsInText` ders gövdesinde GEÇEN en-yüksek-niyetli
 * terimleri bulur; liste boşsa bileşen hiçbir şey çizmez.
 */
export function LessonRelatedTerms({ terms }: { terms: readonly Terim[] }) {
  if (terms.length === 0) return null;

  return (
    <section aria-labelledby="ilgili-terimler" className="mt-10 rounded-2xl border border-site-border bg-site-soft p-5">
      <h2 id="ilgili-terimler" className="text-sm font-semibold uppercase tracking-wide text-site-muted">
        İlgili terimler
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {terms.map((terim) => (
          <li key={terim.tr}>
            <Link
              href={`/sozluk/${terimSlug(terim.tr)}`}
              className="inline-flex min-h-11 items-center rounded-full border border-site-border bg-site-surface px-4 text-sm font-medium text-site-accent-text underline underline-offset-4"
            >
              {terim.tr}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
