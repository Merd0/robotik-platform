import type { Metadata } from "next";
import { RobotInterview } from "@/components/lab/RobotInterview";

export const metadata: Metadata = {
  title: "Robot Röportajı",
  description: "Katalogdaki bir robota sorular sor; cevaplar gerçek RobotSpec verisinden ve üretici kaynağından gelir.",
};

export default function RobotRoportajiPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Serbest deney</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Robot Röportajı</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-site-muted">
          Bir robot seç, ona sorular sor. Her cevap o robotun gerçek eklem sayısından, hızından, limitinden ve —
          varsa — üreticisinin yayınladığı teknik veri sayfasından geliyor. Jenerik robotlar hiçbir zaman marka
          uydurmaz; kaynağı olmayan bir sayı hiç söylenmez.
        </p>

        <div className="mt-8">
          <RobotInterview />
        </div>
      </div>
    </main>
  );
}
