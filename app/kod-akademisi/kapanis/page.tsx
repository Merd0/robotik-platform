import type { Metadata } from "next";
import Link from "next/link";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";
import { EsnekHucreLab } from "@/components/kod-akademisi/EsnekHucreLab";
import { computeEsnekHucreContentVersion } from "@/lib/esnekHucreArtifact";
import { GECERLI_PARCA_TURLERI, HEDEF_SAYISI_ARALIGI } from "@/lib/esnekHucre";

export const metadata: Metadata = {
  title: "Esnek Hücreyi Devreye Al · Kod Akademisi",
  description: "Usta ötesi kapanış projesi: iş emri doğrulayan, durum makinesi kuran, arızayı toparlayan bir hücre yöneticisi yaz.",
  alternates: { canonical: "/kod-akademisi/kapanis" },
};

export default function EsnekHucreKapanisPage() {
  const contentVersion = computeEsnekHucreContentVersion();
  const lessonId = "koda-kapanis-esnek-hucre";

  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <LessonEvidenceProvider lessonId={lessonId} contentVersion={contentVersion}>
          <nav aria-label="İçerik yolu" className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
            <Link href="/kod-akademisi" className="inline-flex min-h-11 items-center underline underline-offset-4">Kod Akademisi</Link>
            <span>/</span>
            <span className="inline-flex min-h-11 items-center">Kapanış projesi</span>
          </nav>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Usta ötesi kapanış projesi</p>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Esnek Hücreyi Devreye Al
          </h1>

          <div className="ders-icerik mt-6 flex max-w-3xl flex-col gap-4">
            <p>
              Şimdiye kadar her modülde tek bir görevi çözdün. Bu proje farklı: beşinci bir küçük
              ders değil, Usta modüllerinden sonra açılan TEK bir mühendislik projesi. Bir üretim
              hattına giriş sensöründen gelen iş emirlerini alıp parçayı doğru hedeflere taşıyan,
              hatayı güvenli bir duruma çeviren ve kendi davranışını testlerle kanıtlayan BİR Python
              dosyası yazacaksın. Altı teslim taşının hepsi aynı dosyayı büyütüyor — yeni bir dosyaya
              geçmiyorsun.
            </p>
            <p>
              Yüzey gerçek robot kontrolü değil: bu, sürümlü bir semantik simülasyon (aynı platformun
              her yerindeki &ldquo;kinematik dijital prova&rdquo; sınırı burada da geçerli). Kod, bu sayfaya
              enjekte edilen iki araçla çalışır:
            </p>
            <ul className="list-disc pl-6">
              <li><code>robot.movel(x, y, z)</code> — hedefe git; ulaşılamazsa <code>RobotHatasi</code> fırlatır.</li>
              <li>
                <code>hucre</code> — <code>hucre.sensor_onayi_bekle()</code> (True/False),{" "}
                <code>hucre.durum_gec(&quot;ad&quot;)</code> ve <code>hucre.hata_bildir(&quot;sebep&quot;)</code>.
              </li>
            </ul>
            <p>
              Şartname sabit: parça türü yalnızca <strong>{GECERLI_PARCA_TURLERI.join(", ")}</strong>{" "}
              olabilir; iş emrindeki hedef sayısı <strong>{HEDEF_SAYISI_ARALIGI.min}–{HEDEF_SAYISI_ARALIGI.max}</strong>{" "}
              arasında olmalı. Bunların dışındaki bir iş emri, robot hiç hareket etmeden reddedilmeli.
            </p>
            <p>
              Değerlendirme kaynak kodunun metnine bakmaz — yalnız gözlenen davranışa: durum geçişlerine,
              hata bildirimlerine ve gerçek robot hareketlerine. En az üç görünür ve iki gizli senaryo
              var; hepsi deterministik, hepsi aynı şartnameden türetildi.
            </p>
          </div>

          <div className="mt-8">
            <EsnekHucreLab />
          </div>

          <nav className="mt-10 flex items-center justify-between gap-4 border-t border-site-border pt-6 text-sm">
            <Link href="/kod-akademisi/usta" className="inline-flex min-h-11 items-center underline underline-offset-4">
              ← Usta aşamasına dön
            </Link>
            <span />
          </nav>
        </LessonEvidenceProvider>
      </div>
    </main>
  );
}
