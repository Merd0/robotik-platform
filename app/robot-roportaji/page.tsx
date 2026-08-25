import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";
import { RobotInterview } from "@/components/lab/RobotInterview";

export const metadata: Metadata = createPageMetadata({
  title: "Robot Röportajı",
  description: "Katalogdaki bir robota sorular sor; cevaplar gerçek RobotSpec verisinden ve üretici kaynağından gelir.",
  path: "/robot-roportaji",
});

export default function RobotRoportajiPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-site-muted"><Link href="/laboratuvar" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvarlar</Link> <span aria-hidden="true">/</span> Robot Röportajı</nav>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Serbest deney · devreye alma mülakatı</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Robot Röportajı</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-site-muted">
          Bir saha mühendisi, hiç tanımadığı bir robotla çalışmaya başlamadan önce belli soruların cevabını bilmek
          ister: kaç ekseni var, en hızlı ve en kısıtlı eklemi hangisi, tipik duruşunda tekilliğe ne kadar yakın,
          verdiği sayıların kaynağı ne? Bu sayfa o mülakatı simüle eder. Bir robot seç, aynı soruları sor — her
          cevap gerçek eklem sayısından, hızından, limitinden ve varsa üreticinin yayınladığı teknik veri
          sayfasından hesaplanır. Jenerik robotlar hiçbir zaman marka uydurmaz; kaynağı olmayan bir sayı hiç
          söylenmez.
        </p>

        <div className="mt-8">
          <RobotInterview />
        </div>
      </div>
    </main>
  );
}
