import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";
import { KodaFrameChainLab } from "@/components/kod-akademisi/KodaFrameChainLab";
import { computeKodaFrameChainContentVersion } from "@/lib/kodaFrameChainArtifact";

export const metadata: Metadata = createPageMetadata({
  title: "Çerçeve zincirini birleştir · Kod Akademisi",
  description: "Usta sonrası uzmanlık stüdyosu: taban-dünya dönüşümünü doğru sırayla birleştir, görmediğin bir zincire de genelle.",
  path: "/kod-akademisi/uzmanlik-cerceve-zinciri",
});

export default function KodaFrameChainPage() {
  const contentVersion = computeKodaFrameChainContentVersion();
  const lessonId = "koda-uzmanlik-cerceve-zinciri";

  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <LessonEvidenceProvider lessonId={lessonId} contentVersion={contentVersion}>
          <nav aria-label="İçerik yolu" className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
            <Link href="/kod-akademisi" className="inline-flex min-h-11 items-center underline underline-offset-4">Kod Akademisi</Link>
            <span>/</span>
            <span className="inline-flex min-h-11 items-center">Usta sonrası uzmanlık stüdyosu</span>
          </nav>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Usta sonrası uzmanlık stüdyosu</p>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Çerçeve zincirini birleştir
          </h1>

          <div className="ders-icerik mt-6 flex max-w-3xl flex-col gap-4">
            <p>
              Bu, Hat A&apos;daki <em>homojen dönüşüm</em> dersinin devamı: bir robotun taban
              çerçevesindeki bir nokta, dünya çerçevesine göre nerede? Cevap, iki dönüşümü BİRLEŞTİRMEYE
              (compose) bağlı — ama sıra önemli, çünkü matris çarpımı değişmeli (commutative) DEĞİLDİR.
            </p>
            <p>
              Aşağıdaki kodda <code>mat_carp</code>, <code>nokta_donustur</code>, <code>rotz</code> ve{" "}
              <code>translation</code> zaten hazır — bunları YAZMAYACAKSIN. Görevin: iki dönüşümün
              BİRLEŞTİRME SIRASINI düzeltmek. Taban çerçevesi önce döndürülüp sonra ötelenmeli mi, yoksa
              önce ötelenip sonra mı döndürülmeli? (İpucu: taban, dünyaya göre önce kendi ekseninde döner,
              sonra bir konuma taşınır — <code>translation · rotz</code>, tersi değil.)
            </p>
            <p>
              İki senaryoyla ölçülüyor: biri gösterilen taban konumu/açısıyla, biri GİZLİ — farklı bir
              taban konumu ve nokta ile. Sonucu sabit sayı olarak yazmak ikincisinde işe yaramaz;
              matrisin gerçekten doğru sırayla birleştiği kanıtlanmalı.
            </p>
            <p className="text-sm text-site-muted">
              Not: Bu stüdyo NumPy KULLANMAZ — platform hiçbir bilimsel Python paketini yerel olarak
              barındırmıyor (bkz. platformun tedarik zinciri ilkeleri). Aynı matematik saf Python 4×4
              liste-matrisleriyle çalışıyor; kavram (kimlik, birleştirme sırası, değişmezlik-olmama)
              birebir aynı.
            </p>
          </div>

          <div className="mt-8">
            <KodaFrameChainLab />
          </div>

          <nav className="mt-10 flex items-center justify-between gap-4 border-t border-site-border pt-6 text-sm">
            <Link href="/kod-akademisi/usta" className="inline-flex min-h-11 items-center underline underline-offset-4">
              ← Usta aşamasına dön
            </Link>
            <Link href="/kod-akademisi/kapanis" className="inline-flex min-h-11 items-center text-right underline underline-offset-4">
              Kapanış projesine geç →
            </Link>
          </nav>
        </LessonEvidenceProvider>
      </div>
    </main>
  );
}
