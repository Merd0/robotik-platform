import type { Metadata } from "next";
import { TimeCapsule } from "@/components/lab/TimeCapsule";

export const metadata: Metadata = {
  title: "Zaman Kapsülü",
  description: "Tarayıcındaki gerçek deney kaydından 1 hafta, 1 ay, 3 ay ve 1 yıl önceki anları geri getirir. Hesap yok, sunucuya hiçbir şey gönderilmez.",
};

export default function ZamanKapsuluPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Serbest deney</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Zaman Kapsülü</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-site-muted">
          Tarayıcında biriken gerçek deney kaydın, 1 hafta, 1 ay, 3 ay ve 1 yıl önceye gerçekten karşılık gelen bir
          olay varsa onu geri getirir. Hesap yok — bu kayıt yalnız bu tarayıcıda, yalnız sende duruyor.
        </p>

        <div className="mt-8">
          <TimeCapsule />
        </div>
      </div>
    </main>
  );
}
