import type { Metadata } from "next";
import Link from "next/link";
import { InverseProblemLab } from "@/components/lab/InverseProblemLab";

export const metadata: Metadata = {
  title: "Ters problem modu — aynı TCP için iki robot duruşu",
  description: "Bir TCP hedefini üreten eklem açılarını deneyerek bul; aynı hedef için dirsek yukarı ve aşağı iki geçerli ters kinematik çözümünü doğrula.",
};

export default function InverseProblemPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
          <Link href="/laboratuvar" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvarlar</Link>
          <span aria-hidden="true">/</span>
          Ters problem modu
        </nav>
        <header className="mt-8 max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Çıktıdan girdiye · çoklu çözüm</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Hedef belli. Onu üreten açıları sen bul.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-site-muted">Robotik problemini tersine çevir: eklem açılarını verip sonucu izlemek yerine, istenen TCP çıktısından geriye doğru iki farklı eklem duruşu keşfet.</p>
        </header>
        <div className="mt-10"><InverseProblemLab /></div>
      </div>
    </main>
  );
}
