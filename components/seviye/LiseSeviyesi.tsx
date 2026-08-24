import Link from "next/link";
import { LessonProgressBadge } from "@/components/ui/LessonProgressBadge";
import { BaslangicRotasi } from "./BaslangicRotasi";
import { LessonPreview } from "./LessonPreview";
import { PickAndPlaceCell } from "./PickAndPlaceCell";
import { SeviyeGecisi } from "./SeviyeGecisi";
import type { SeviyeVerisi } from "./seviyeVerisi";

const TELEMETRI = "Q1=18° · Q2=−34° · ERİŞİM=TAMAM · A*-MALİYET=12 · KOD=move_j(q1) · ";

/*
 * Lise sayfası ortadaki dozda durur (docs/05 Bölüm 1): hâlâ merak ve keşif
 * dili var ama süsleme azalır, ölçüm öne çıkar. Ortaokulun sticker
 * konturları burada ince çizgiye, üniversitenin çıplak indeksi ise hâlâ
 * "liste" dilini koruyan kartlara dönüşür.
 */
export function LiseSeviyesi({ veri }: { veri: SeviyeVerisi }) {
  return (
    <main
      id="ana-icerik"
      data-seviye="lise"
      className="min-h-screen bg-poster-bg text-poster-ink [--onizleme-ikincil:var(--color-poster-teal)] [--onizleme-vurgu:var(--color-poster-blue)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
        <nav aria-label="İçerik yolu" className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-bold text-poster-ink underline-offset-4 hover:underline">← Ana sayfa</Link>
          <SeviyeGecisi aktif="lise" bicim="pill" />
        </nav>

        <section className="mt-8 grid gap-9 border-b border-poster-line pb-9 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <div className="min-w-0">
            <p className="font-mono text-[12.5px] font-bold uppercase tracking-[0.1em] text-poster-blue-text">Seviye 2 · Ölçerek açıkla</p>
            <h1 className="mt-2 font-heading text-7xl font-black leading-[0.9] sm:text-8xl">Lise</h1>
            <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-poster-muted">
              Koordinatlar, iki eklemli kinematik ve rota kararlarını ölçerek açıkla. Sonuç bir izlenim değil,
              bir sayı — ve o sayının nereden geldiğini gösterebiliyorsun.
            </p>

            <dl className="mt-6 flex flex-wrap gap-8">
              {[
                [String(veri.dersSayisi), "ders"],
                [String(veri.hatlar.length), "hat"],
              ].map(([deger, etiket]) => (
                <div key={etiket}>
                  <dd className="font-mono text-3xl font-bold leading-none text-poster-blue-text">{deger}</dd>
                  <dt className="mt-1 text-xs text-poster-subtle">{etiket}</dt>
                </div>
              ))}
            </dl>

            <div aria-hidden="true" className="mt-6 overflow-hidden border-y border-poster-line py-2">
              <div className="inline-flex whitespace-nowrap font-mono text-[11px] text-poster-subtle [animation:marquee-scroll_15s_linear_infinite]">
                <span className="pr-10">{TELEMETRI.repeat(2)}</span>
                <span className="pr-10">{TELEMETRI.repeat(2)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-poster-line bg-poster-surface p-5 shadow-[0_10px_28px_-14px_rgba(30,79,224,0.35)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-poster-blue-text">Erişim testi</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase text-poster-teal-text">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-poster-teal [animation:pulse-dot_1.4s_ease-in-out_infinite]" />
                canlı
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-poster-subtle">al-taşı-bırak döngüsü · parçayı bir konumdan diğerine taşır</p>
            <div className="mt-2">
              <PickAndPlaceCell eklemRengi="var(--color-poster-teal)" eklemKenari="var(--color-poster-teal-text)" />
            </div>
            <p className="mt-2 font-mono text-[10.5px] text-poster-subtle">kol iki eklemini birlikte çevirerek her hedefe varıyor</p>
          </div>
        </section>

        <BaslangicRotasi seviye="lise" dersler={veri.baslangicRotasi} />

        <section className="mt-10" aria-label="Ders listesi">
          <h2 className="font-heading text-4xl font-extrabold">Ders listesi</h2>
          <p className="mt-1 text-sm text-poster-subtle">Her kart, derste kullanacağın etkileşimli sahnenin önizlemesini taşır.</p>

          <div className="mt-8 space-y-11">
            {veri.hatlar.map(({ hat, etiket, harf, dersler }) => (
              <div key={hat}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-3 font-heading text-2xl font-bold">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-poster-blue font-mono text-xs font-bold text-white">{harf}</span>
                    {etiket}
                  </h3>
                  <Link href={`/seviye/lise/hat/${hat}`} className="inline-flex min-h-11 items-center text-sm font-bold text-poster-blue-text underline-offset-4 hover:underline">
                    Hattın sırasını aç →
                  </Link>
                </div>

                <ul className="mt-4 grid gap-5 md:grid-cols-2">
                  {dersler.map((ders) => (
                    <li key={ders.slug}>
                      <Link href={`/ders/${ders.slug}`} className="lab-window group flex h-full flex-col transition hover:-translate-y-0.5 hover:border-poster-blue">
                        <div className="flex items-center justify-between gap-3 border-b border-poster-line px-4 py-2.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.06em] text-poster-subtle">
                          <span>{harf} · {ders.kanal}</span>
                          <span className="flex items-center gap-2">
                            <LessonProgressBadge slug={ders.slug} seviye="lise" contentVersion={ders.contentVersion} />
                            <span>{ders.sure} dk</span>
                          </span>
                        </div>
                        <div className="grid h-24 place-items-center bg-poster-soft">
                          <LessonPreview tur={ders.onizleme} />
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <span className="font-mono text-[11.5px] text-poster-subtle">{ders.etkilesim}</span>
                          <h4 className="mt-2 font-heading text-xl font-bold leading-tight">{ders.baslik}</h4>
                          <span className="mt-auto pt-3 text-[13.5px] font-bold text-poster-blue-text">
                            Derse başla <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span>
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
