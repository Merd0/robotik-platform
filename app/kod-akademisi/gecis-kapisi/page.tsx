import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";
import { KodaTransferLab } from "@/components/kod-akademisi/KodaTransferLab";
import { Quiz } from "@/components/interactive/Quiz";
import { computeKodaTransferContentVersion } from "@/lib/kodaTransferArtifact";

export const metadata: Metadata = createPageMetadata({
  title: "Satırdan poza: izle, tahmin et, düzelt · Kod Akademisi",
  description: "İleri → Usta geçiş kapısı: satır-poz-iz eşlemesiyle bir hatayı bul, düzelt ve görmediğin bir hedefe genellediğini kanıtla.",
  path: "/kod-akademisi/gecis-kapisi",
});

export default function KodaTransferKapisiPage() {
  const contentVersion = computeKodaTransferContentVersion();
  const lessonId = "koda-gecis-satirdan-poza";

  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <LessonEvidenceProvider lessonId={lessonId} contentVersion={contentVersion}>
          <nav aria-label="İçerik yolu" className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
            <Link href="/kod-akademisi" className="inline-flex min-h-11 items-center underline underline-offset-4">Kod Akademisi</Link>
            <span>/</span>
            <span className="inline-flex min-h-11 items-center">İleri → Usta geçiş kapısı</span>
          </nav>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">İleri → Usta geçiş kapısı</p>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Satırdan poza: izle, tahmin et, düzelt
          </h1>

          <div className="ders-icerik mt-6 flex max-w-3xl flex-col gap-4">
            <p>
              Aşağıdaki kod iki hedefe sırayla gitmesi gereken bir fonksiyon: önce{" "}
              <code>(x1, y1)</code>&apos;e, sonra <code>(x2, y2)</code>&apos;ye. Ama bir satırda bir
              kopyala-yapıştır hatası var — kolun gerçekte nereye gideceğini önce ZİHNİNDE tahmin et,
              sonra çalıştır.
            </p>
            <p>
              Çalıştırınca sağdaki &quot;Çalışma izi&quot; ile kod editöründeki satır vurgusu senkron
              hareket eder (aynı özellik, ders sayfalarındaki Python laboratuvarlarında da var) — hangi
              satırın robotu nereye götürdüğünü adım adım izleyebilirsin. Hatayı bul, düzelt.
            </p>
            <p>
              Bu görev iki senaryoyla ölçülüyor: biri yukarıda gördüğün hedeflerle, biri GİZLİ — farklı
              koordinatlarla. Kodun hedefi <em>sabit sayı</em> olarak değil, fonksiyonun parametreleri
              üzerinden hesaplaması gerekiyor; aksi hâlde gizli senaryoda yanlış yere gider. Bu, ezberi
              değil genellemeyi ölçüyor.
            </p>
          </div>

          <div className="mt-8">
            <KodaTransferLab />
          </div>

          <div className="mt-8 max-w-3xl">
            <Quiz
              sorular={[
                {
                  soru: "Kod, doğru sonucu vermek için hedef koordinatları neden SABİT SAYI olarak yazmamalı?",
                  secenekler: [
                    "Python'da sabit sayı yazmak yasak olduğu için",
                    "Farklı bir hedefle (gizli senaryo) çalıştırıldığında yanlış sonuç verir",
                    "Kod daha yavaş çalışır",
                  ],
                  dogru: 1,
                  aciklama: "Sabit sayı, yalnız o örnek için doğru sonucu ezberler. Fonksiyonun parametrelerini kullanmak, aynı mantığın her girdide çalışmasını sağlar — bu genellemedir.",
                },
              ]}
            />
          </div>

          <nav className="mt-10 flex items-center justify-between gap-4 border-t border-site-border pt-6 text-sm">
            <Link href="/kod-akademisi/ileri" className="inline-flex min-h-11 items-center underline underline-offset-4">
              ← İleri aşamasına dön
            </Link>
            <Link href="/kod-akademisi/usta" className="inline-flex min-h-11 items-center text-right underline underline-offset-4">
              Usta aşamasına geç →
            </Link>
          </nav>
        </LessonEvidenceProvider>
      </div>
    </main>
  );
}
