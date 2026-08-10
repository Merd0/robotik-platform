import Link from "next/link";
import { LessonProgressBadge } from "@/components/ui/LessonProgressBadge";
import { LessonPreview } from "./LessonPreview";
import { PickAndPlaceCell } from "./PickAndPlaceCell";
import { SeviyeGecisi } from "./SeviyeGecisi";
import type { SeviyeVerisi } from "./seviyeVerisi";

const TELEMETRI = "Q1=24° · Q2=61° · ẋ=0.31 · ẏ=−0.08 · J-COND=2.4 · IK-ITER=6 · DURUM=TAMAM · ";

/*
 * Üniversite sayfası "araç/referans" gibi durur (docs/05 Bölüm 1: seviye
 * yükseldikçe oyunlaştırma dozu düşer). Somut karşılığı: sıkı ölçüm
 * tipografisi, dolu renk yerine çizgi, "ders" yerine "kanal/indeks" dili.
 */
export function UniversiteSeviyesi({ veri }: { veri: SeviyeVerisi }) {
  return (
    <main
      id="ana-icerik"
      data-seviye="universite"
      className="min-h-screen bg-poster-bg text-poster-ink [--onizleme-ikincil:var(--color-poster-teal)] [--onizleme-vurgu:var(--color-poster-purple)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div aria-hidden="true" className="flex justify-between border-b border-poster-line pb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-poster-subtle">
          <span>Robotik Lab · Seviye 3</span>
          <span>Kalibre ✓ · kaynaklı yayın</span>
        </div>

        <nav aria-label="İçerik yolu" className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center font-mono text-[13px] text-poster-ink underline-offset-4 hover:underline">← ana sayfa</Link>
          <SeviyeGecisi aktif="universite" bicim="mono" />
        </nav>

        <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:items-stretch">
          <div className="min-w-0">
            <p className="font-mono text-[11.5px] font-bold uppercase tracking-[0.08em] text-poster-purple-text">Seviye 3 · Matematiksel sınır</p>
            <h1 className="mt-2 font-heading text-6xl font-extrabold leading-none sm:text-7xl">Üniversite</h1>
            <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-poster-muted">
              DH, Jacobian, nümerik IK ve planlayıcıları matematiksel sınırlarıyla sına. Her ders kaynaklarıyla
              birlikte yayımlanır; sahnedeki sayı, derste anlatılan formülden üretilir.
            </p>

            <dl className="mt-5 flex flex-wrap gap-x-9 gap-y-3 border-y border-poster-line py-3.5 font-mono text-[12.5px] text-poster-muted">
              {[
                [String(veri.dersSayisi), "ders"],
                [String(veri.hatlar.length), "hat"],
                ["%100", "kaynaklı"],
                ["0", "hesap / çerez"],
              ].map(([deger, etiket]) => (
                <div key={etiket} className="flex items-baseline gap-1.5">
                  <dt className="sr-only">{etiket}</dt>
                  <dd className="font-bold text-poster-ink">{deger}</dd>
                  <span aria-hidden="true">{etiket}</span>
                </div>
              ))}
            </dl>

            <div aria-hidden="true" className="mt-4 overflow-hidden border-y border-poster-line py-2">
              <div className="inline-flex whitespace-nowrap font-mono text-[11px] text-poster-subtle [animation:marquee-scroll_16s_linear_infinite]">
                <span className="pr-10">{TELEMETRI.repeat(2)}</span>
                <span className="pr-10">{TELEMETRI.repeat(2)}</span>
              </div>
            </div>
          </div>

          <div className="lab-window p-5 text-poster-ink">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-poster-purple-text">Canlı hücre</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase text-poster-teal-text">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-poster-teal [animation:pulse-dot_1.4s_ease-in-out_infinite]" />
                canlı
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-poster-subtle">al-taşı-bırak döngüsü · parçayı bir konumdan diğerine taşır</p>
            <div className="mt-2">
              <PickAndPlaceCell eklemRengi="var(--color-poster-purple)" eklemKenari="var(--color-poster-ink)" />
            </div>
            <p className="mt-2 font-mono text-[10.5px] text-poster-subtle">her hedef için eklem açıları ters kinematikle çözülür</p>
          </div>
        </section>

        <section className="mt-12" aria-label="Ders indeksi">
          <h2 className="font-heading text-3xl font-bold">Ders indeksi</h2>
          <p className="mt-1 text-[12.5px] text-poster-subtle">Her pencere, ilgili derste kullanılan görselleştirmenin küçültülmüş halidir.</p>

          <div className="mt-8 space-y-10">
            {veri.hatlar.map(({ hat, etiket, harf, dersler }) => (
              <div key={hat}>
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-poster-line pb-2.5">
                  <h3 className="flex items-baseline gap-3 font-heading text-2xl font-bold">
                    <span aria-hidden="true" className="font-mono text-sm font-bold text-poster-purple-text">CH.{harf}</span>
                    {etiket}
                  </h3>
                  <Link href={`/seviye/universite/hat/${hat}`} className="inline-flex min-h-11 items-center font-mono text-[12px] text-poster-purple-text underline-offset-4 hover:underline">
                    hattın sırasını aç →
                  </Link>
                </div>

                <ul className="mt-4 grid gap-4 md:grid-cols-2">
                  {dersler.map((ders) => (
                    <li key={ders.slug}>
                      <Link href={`/ders/${ders.slug}`} className="lab-window group flex h-full flex-col transition hover:-translate-y-0.5 hover:border-poster-purple">
                        <div className="flex items-center justify-between border-b border-poster-line px-4 py-2.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.06em] text-poster-subtle">
                          <span>CH.{harf} — {ders.kanal}</span>
                          {/* Yanıp sönen kısım metin değil, arka plan rengi taşıyan bir nokta.
                              Metnin kendi opaklığını kısmak kontrast oranını ölçülebilir
                              biçimde düşürüyor; noktanın opaklığı hiçbir eşiğe tabi değil. */}
                          <span aria-hidden="true" className="rec-isaret inline-flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-current [animation:rec-blink_1.4s_step-end_infinite]" />
                            KAYIT
                          </span>
                        </div>
                        <div className="grid h-28 place-items-center bg-poster-soft">
                          <LessonPreview tur={ders.onizleme} />
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex justify-between gap-3 font-mono text-[11px] text-poster-subtle">
                            <span>{ders.sure} dk</span>
                            <span>{ders.etkilesim}</span>
                          </div>
                          <h4 className="mt-2 font-heading text-xl font-bold leading-tight">{ders.baslik}</h4>
                          <span className="mt-auto pt-3 text-[13px] font-bold text-poster-purple-text">
                            Aç <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span>
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="sr-only">
                  {dersler.map((ders) => (
                    <LessonProgressBadge key={ders.slug} slug={ders.slug} seviye="universite" contentVersion={ders.teachingHash} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
