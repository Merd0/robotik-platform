import type { Metadata } from "next";
import Link from "next/link";
import { RobotCellStudio } from "@/components/lab/RobotCellStudio";
import { RobotCellCapstone } from "@/components/lab/RobotCellCapstone";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";

export const metadata: Metadata = {
  title: "3B Robot Hücresi Laboratuvarı",
  description: "Altı eksenli robotu üç boyutta sür, gerçek FK ile TCP pozunu gözlemle ve hücre devreye alma görevlerini çöz.",
};

export default function RobotCellPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14">
        <nav className="flex items-center gap-2 text-sm text-site-muted">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvar</Link>
          <span aria-hidden="true">/</span>
          Robot hücresi
        </nav>

        <header className="mt-8 max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">3B simülasyon + bütünleştirme deneyi</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Robot hücresini yalnızca izleme; devreye al.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-site-muted">
            Önce altı eksenli kolu gerçek kinematik zinciriyle üç boyutta sür. Ardından aynı hücre düşüncesini kalibrasyon, rota, program sırası ve güvenli hız görevlerinde sınayarak kararlarını tamamla.
          </p>
        </header>

        <div className="mt-10">
          <RobotCellStudio />
        </div>

        <section className="mt-16" aria-labelledby="devreye-alma-gorevleri">
          <div className="mb-7 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Uygulama senaryosu</p>
            <h2 id="devreye-alma-gorevleri" className="mt-2 font-heading text-3xl font-semibold tracking-tight text-site-ink sm:text-4xl">Hücre kararlarını sırayla doğrula</h2>
            <p className="mt-3 text-base leading-7 text-site-muted">3B kumandada pozu gördün. Şimdi kamera ölçeğinden insan-robot ayrımına kadar dört devreye alma kararının neden birbirine bağlı olduğunu çöz.</p>
          </div>
          <LessonEvidenceProvider lessonId="capstone-robot-hucresi" contentVersion="beta-2026-08-07">
            <RobotCellCapstone />
          </LessonEvidenceProvider>
        </section>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-site-subtle">
          Bu eğitim sahnesi gerçek hücre risk değerlendirmesinin veya üretici güvenlik talimatlarının yerine geçmez. Sonuçlar yalnızca bu tarayıcıda oluşan deney kayıtlarıdır; sertifika ya da güvenlik onayı değildir.
        </p>
      </div>
    </main>
  );
}
