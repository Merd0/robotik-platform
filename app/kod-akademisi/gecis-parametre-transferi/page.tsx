import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";
import { KodaParametreLab } from "@/components/kod-akademisi/KodaParametreLab";
import { computeKodaParametreContentVersion } from "@/lib/kodaParametreArtifact";

export const metadata: Metadata = createPageMetadata({
  title: "Aynı komutu farklı hedefe genelle · Kod Akademisi",
  description: "Temel → Orta geçiş kapısı: bir fonksiyonu parametrelerini kullanacak şekilde düzelt, görmediğin bir hedefe de genellediğini kanıtla.",
  path: "/kod-akademisi/gecis-parametre-transferi",
});

export default function KodaParametreKapisiPage() {
  const contentVersion = computeKodaParametreContentVersion();
  const lessonId = "koda-gecis-parametre-transferi";

  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <LessonEvidenceProvider lessonId={lessonId} contentVersion={contentVersion}>
          <nav aria-label="İçerik yolu" className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
            <Link href="/kod-akademisi" className="inline-flex min-h-11 items-center underline underline-offset-4">Kod Akademisi</Link>
            <span>/</span>
            <span className="inline-flex min-h-11 items-center">Temel → Orta geçiş kapısı</span>
          </nav>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Temel → Orta geçiş kapısı</p>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Aynı komutu farklı hedefe genelle
          </h1>

          <div className="ders-icerik mt-6 flex max-w-3xl flex-col gap-4">
            <p>
              Temel aşamada hep TEK bir hedefe kod yazdın: &quot;J1=90°, J2=-60° olsun&quot; dedik, sen de
              o iki sayıyı yazdın. Ama gerçek bir program aynı komutu FARKLI hedeflerle de çalıştırabilmeli
              — işte bu <em>parametre</em> demek.
            </p>
            <p>
              Aşağıdaki <code>git(j1, j2)</code> fonksiyonu parametre ALIYOR ama onları hiç KULLANMIYOR —
              içinde hâlâ eski, sabit sayılar yazılı. Fonksiyonun gövdesini, <code>j1</code> ve{" "}
              <code>j2</code>&apos;yi gerçekten kullanacak şekilde düzelt.
            </p>
            <p>
              İki senaryoyla ölçülüyor: biri gösterilen hedefle (J1=90°, J2=-60°), biri GİZLİ — tamamen
              farklı açılarla. Fonksiyonun içine hâlâ sabit sayı yazarsan görüneni geçersin ama gizli
              senaryoda robot yanlış yere gider.
            </p>
          </div>

          <div className="mt-8">
            <KodaParametreLab />
          </div>

          <nav className="mt-10 flex items-center justify-between gap-4 border-t border-site-border pt-6 text-sm">
            <Link href="/kod-akademisi/temel" className="inline-flex min-h-11 items-center underline underline-offset-4">
              ← Temel aşamasına dön
            </Link>
            <Link href="/kod-akademisi/orta" className="inline-flex min-h-11 items-center text-right underline underline-offset-4">
              Orta aşamasına geç →
            </Link>
          </nav>
        </LessonEvidenceProvider>
      </div>
    </main>
  );
}
