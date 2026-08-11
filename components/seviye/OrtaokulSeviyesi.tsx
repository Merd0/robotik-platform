import Link from "next/link";
import { LessonProgressBadge } from "@/components/ui/LessonProgressBadge";
import { BaslangicRotasi } from "./BaslangicRotasi";
import { SeviyeGecisi } from "./SeviyeGecisi";
import type { SeviyeVerisi } from "./seviyeVerisi";

/*
 * Ortaokul sayfası en yüksek oyunlaştırma dozunda (docs/05 Bölüm 1): kalın
 * kontur, sticker gölge, hafif eğik kartlar, sallanan bir robot madalyonu.
 * Diğer iki seviyenin ölçüm penceresi ve mono telemetri şeridi burada YOK —
 * bu eksiklik değil, dozun kendisi.
 *
 * Kart renkleri dört renkli bir döngüden gelir; dördü de siyah metinle
 * 8:1'in üstünde kalıyor, yani renk değişimi okunabilirliği hiç
 * oynatmıyor. Renk ayrıca tek başına bilgi taşımıyor: her kartta harf
 * rozeti ve etkileşim etiketi yazılı.
 */
const KART_RENKLERI = ["#00c9a7", "#ff8a5b", "#ffd43b", "#7ce0c9"];
const KART_EGIMLERI = ["-1deg", "0.8deg", "-0.6deg", "1deg"];

export function OrtaokulSeviyesi({ veri }: { veri: SeviyeVerisi }) {
  /* Renk döngüsü hat sınırında sıfırlanmasın diye her hattın kaçıncı karttan
     başladığını önden hesaplıyoruz — yoksa her hat aynı renkle açılırdı. */
  const hatlar = veri.hatlar.map((blok, sira) => ({
    ...blok,
    baslangic: veri.hatlar.slice(0, sira).reduce((toplam, oncekiBlok) => toplam + oncekiBlok.dersler.length, 0),
  }));

  return (
    <main id="ana-icerik" data-seviye="ortaokul" className="min-h-screen bg-poster-bg text-poster-ink">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <nav aria-label="İçerik yolu" className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-bold text-poster-ink underline-offset-4 hover:underline">← Ana sayfa</Link>
          <SeviyeGecisi aktif="ortaokul" bicim="sticker" />
        </nav>

        <section className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)]">
          <div className="min-w-0">
            <p className="font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-poster-teal-text">Seviye 1 · Görerek dene</p>
            <h1 className="mt-2 font-heading text-[clamp(4.5rem,12vw,8rem)] font-black leading-[0.88] [text-shadow:5px_5px_0_var(--color-poster-teal)]">Ortaokul</h1>
            <p className="mt-6 max-w-lg text-lg font-medium leading-relaxed text-poster-muted">
              Robot kavramı, eklem hareketi ve labirent planlamayı görerek dene. Her ders kısa bir oyun gibi
              başlar: önce tahmin et, sonra robotu çalıştır.
            </p>
            <dl className="mt-7 flex flex-wrap gap-7">
              {[
                [String(veri.dersSayisi), "ders"],
                [String(veri.hatlar.length), "hat başladı"],
                ["0", "kurulum"],
              ].map(([deger, etiket]) => (
                <div key={etiket} className="flex items-baseline gap-2">
                  <dd className="font-mono text-lg font-bold">{deger}</dd>
                  <dt className="text-sm text-poster-subtle">{etiket}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div aria-hidden="true" className="relative hidden h-64 place-items-center lg:grid">
            <div className="grid size-40 place-items-center rounded-full border-[5px] border-[#0a0a0a] bg-[#ff8a5b] [animation:bob_3.2s_ease-in-out_infinite]">
              <svg viewBox="0 0 100 100" className="size-20">
                <line x1="30" y1="80" x2="30" y2="35" stroke="#0a0a0a" strokeWidth="9" strokeLinecap="round" />
                <line x1="30" y1="35" x2="70" y2="50" stroke="#0a0a0a" strokeWidth="9" strokeLinecap="round" />
                <circle cx="70" cy="50" r="7" fill="#0a0a0a" />
              </svg>
            </div>
            <span className="absolute right-8 top-3 size-9 rounded-full border-4 border-[#0a0a0a] bg-[#ffd43b] [animation:wiggle_2.4s_ease-in-out_infinite]" />
            <span className="absolute bottom-6 left-3 size-7 rounded-full border-4 border-[#0a0a0a] bg-poster-blue [animation:pulse-dot_1.8s_ease-in-out_infinite]" />
          </div>
        </section>

        <BaslangicRotasi seviye="ortaokul" dersler={veri.baslangicRotasi} />

        <section className="mt-14" aria-label="Ders listesi">
          <h2 className="font-heading text-4xl font-extrabold sm:text-5xl">Bugün hangi deneyi yapalım?</h2>

          <div className="mt-8 space-y-12">
            {hatlar.map(({ hat, etiket, harf, dersler, baslangic }) => (
              <div key={hat}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-heading text-2xl font-bold">{etiket}</h3>
                  <Link href={`/seviye/ortaokul/hat/${hat}`} className="inline-flex min-h-11 items-center text-sm font-bold text-poster-teal-text underline-offset-4 hover:underline">
                    Bu hattın sırasını gör →
                  </Link>
                </div>

                <ul className="mt-5 grid gap-7 md:grid-cols-2">
                  {dersler.map((ders, sira) => {
                    const kartSirasi = baslangic + sira;
                    const renk = KART_RENKLERI[kartSirasi % KART_RENKLERI.length];
                    const egim = KART_EGIMLERI[kartSirasi % KART_EGIMLERI.length];
                    return (
                      <li key={ders.slug}>
                        <Link
                          href={`/ders/${ders.slug}`}
                          /* Kontur ve gölge temayla değişmiyor: kartın zemini her iki temada da
                             aynı parlak renk, dolayısıyla siyah kontur her iki temada da doğru.
                             Hover'da dönmek yerine gölge büyüyor — dönüşü giriş animasyonu
                             yönetiyor ve hover onu ezemezdi. */
                          className="kart-giris flex h-full flex-col rounded-[1.75rem] border-4 border-[#0a0a0a] p-6 text-[#0a0a0a] transition-shadow hover:shadow-[8px_8px_0_#0a0a0a] sm:p-7"
                          style={{ backgroundColor: renk, transform: `rotate(${egim})`, ["--kart-egim" as string]: egim }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-[#0a0a0a] bg-white font-mono text-[15px] font-bold">{harf}</span>
                            <span className="flex flex-col items-end gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 font-mono text-[11.5px] font-bold">
                                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#0a0a0a] [animation:pulse-dot_1.6s_ease-in-out_infinite]" />
                                {ders.etkilesim}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1">
                                <LessonProgressBadge slug={ders.slug} seviye="ortaokul" contentVersion={ders.teachingHash} />
                              </span>
                            </span>
                          </div>
                          <h4 className="mt-4 font-heading text-2xl font-extrabold leading-tight">{ders.baslik}</h4>
                          <p className="mt-2 text-[14.5px] font-medium leading-6">{ders.ilkKazanim}</p>
                          <span className="mt-5 inline-flex min-h-11 w-fit items-center rounded-full bg-[#0a0a0a] px-6 text-sm font-extrabold text-white">
                            Derse başla <span aria-hidden="true" className="ml-1.5">→</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
