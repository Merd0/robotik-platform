import type { Metadata } from "next";
import Link from "next/link";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";
import { RobotCellCapstone } from "@/components/lab/RobotCellCapstone";

export const metadata: Metadata = { title: "Robot Hücresi Capstone", description: "Kalibrasyon, yol planlama, programlama ve güvenliği tek bir canlı robot hücresinde birleştir." };

export default function RobotCellPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="flex items-center gap-2 text-sm text-site-muted"><Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvar</Link> <span aria-hidden="true">/</span> Robot hücresi</nav>
        <header className="mt-8 max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Amiral gemisi deney · beta</p><h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Bir robot hücresini devreye al.</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-site-muted">Dört ayrı dersteki bilgiyi tek görevde kullan: kamerayı kalibre et, çarpışmasız yolu seç, komut sırasını kur ve insan yaklaşırken güvenli hızı doğrula.</p></header>
        <div className="mt-10"><LessonEvidenceProvider lessonId="capstone-robot-hucresi" contentVersion="beta-2026-08-07"><RobotCellCapstone /></LessonEvidenceProvider></div>
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-site-subtle">Bu eğitim sahnesi gerçek hücre risk değerlendirmesinin veya üretici güvenlik talimatlarının yerine geçmez. Hesap ve kanıtlar yalnızca bu tarayıcıda çalışır.</p>
      </div>
    </main>
  );
}
