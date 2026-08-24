import Link from "next/link";
import { ContinueLearning } from "@/components/home/ContinueLearning";
import { HeroExperiment } from "@/components/home/HeroExperiment";
import { getAllLessons, getPublicLessons, HAT_ETIKET, hatEtiket, SEVIYE_ETIKET, type Seviye } from "@/lib/content";
import { ETKILESIM_ETIKETI } from "@/lib/etkilesimEtiket";
import { CURATED_START_ROUTES } from "@/lib/learningRoutes";

const SEVIYELER: { seviye: Seviye; aciklama: string }[] = [
  { seviye: "ortaokul", aciklama: "Robot kavramı, eklem hareketi ve labirent planlamayı görerek dene." },
  { seviye: "lise", aciklama: "Koordinatlar, iki eklemli kinematik ve rota kararlarını ölçerek açıkla." },
  { seviye: "universite", aciklama: "DH, Jacobian, nümerik IK ve planlayıcıları matematiksel sınırlarıyla sına." },
];

/*
 * Hat harfinin rengi üç renk ailesini müfredata bağlar: ilk iki hat teal,
 * ortadaki üç hat mavi, son üçü mor. Sıra hat listesinden gelir, elle
 * yazılmaz — yeni bir hat eklendiğinde renk kendiliğinden dağılır.
 */
function hatRengi(index: number, toplam: number) {
  const ucteBir = Math.max(1, Math.floor(toplam / 3));
  if (index < ucteBir) return "hat-rozet-1";
  if (index < ucteBir * 2) return "hat-rozet-2";
  return "hat-rozet-3";
}

export default function HomePage() {
  const allLessons = getAllLessons();
  const publishedLessons = getPublicLessons().filter((lesson) => lesson.frontmatter.durum === "yayinda");
  const tracks = [...new Set(publishedLessons.map((lesson) => lesson.frontmatter.hat))];
  const interactiveCount = publishedLessons.filter((lesson) => lesson.frontmatter.etkilesimli.length > 0).length;
  const sourceCount = publishedLessons.reduce((toplam, lesson) => toplam + lesson.frontmatter.kaynaklar.length, 0);
  // Yalnız rota adımlarının (3 seviye × 3 ders) çözümlemesi için — 89 dersin
  // tamamını istemci bileşenine prop olarak geçirmiyoruz. "Kaldığın yerden
  // devam et" panelinin rota dışı bir dersi çözmesi gerekirse
  // (kullanıcının son kaydı 9 rota dersinden biri değilse), bu veriyi
  // ContinueLearning bileşeni /devam-index.json'dan tembel yükler
  // (bkz. scripts/build-continue-index.ts, components/home/ContinueLearning.tsx).
  const hatSirasi = Object.keys(HAT_ETIKET);
  const continueLessonBySlug = new Map(
    publishedLessons.map((lesson) => [
      lesson.slug,
      {
        slug: lesson.slug,
        baslik: lesson.frontmatter.baslik,
        seviye: lesson.frontmatter.seviye,
        seviyeEtiketi: SEVIYE_ETIKET[lesson.frontmatter.seviye],
        hatIndex: hatSirasi.indexOf(lesson.frontmatter.hat),
        hatEtiketi: hatEtiket(lesson.frontmatter.hat),
        sira: lesson.frontmatter.sira ?? 0,
        onkosul: lesson.frontmatter.onkosul,
      },
    ]),
  );
  const continueRoutes = SEVIYELER.map(({ seviye }) => ({
    seviye,
    steps: CURATED_START_ROUTES[seviye].map((slug) => {
      const lesson = continueLessonBySlug.get(slug);
      if (!lesson) throw new Error(`Başlangıç rotasındaki ders yayımlı değil: ${slug}`);
      return lesson;
    }),
  }));
  const levelCards = SEVIYELER.map((card) => {
    const lessons = publishedLessons.filter((lesson) => lesson.frontmatter.seviye === card.seviye);
    const interactions = [...new Set(lessons.flatMap((lesson) => lesson.frontmatter.etkilesimli))]
      .map((name) => ETKILESIM_ETIKETI[name])
      .filter((label): label is string => Boolean(label))
      .slice(0, 3);
    return { ...card, lessons, interactions };
  });

  return (
    <main id="ana-icerik" className="min-h-screen overflow-hidden bg-poster-bg text-poster-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6 sm:py-12 lg:gap-24">
        <HeroExperiment />

        <ContinueLearning routes={continueRoutes} />

        <section aria-labelledby="seviye-baslik" className="space-y-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-poster-purple-text">Aynı laboratuvar, üç derinlik</p>
              <h2 id="seviye-baslik" className="mt-1 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Nereden başlamak istiyorsun?</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-poster-muted">Seviye yalnızca renk değil; açıklama, matematik, sınır durumları ve kanıt beklentisi birlikte değişir.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
            {levelCards.map(({ seviye, aciklama, lessons, interactions }) => (
              <Link
                key={seviye}
                href={`/seviye/${seviye}`}
                data-seviye={seviye}
                className="seviye-card group flex min-h-64 flex-col justify-between gap-4 p-7 transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0_var(--color-poster-ink)]"
              >
                <span className="font-heading text-4xl font-black text-[var(--kart-baslik)]">{SEVIYE_ETIKET[seviye]}</span>
                <span className="text-[15px] leading-6 text-[var(--kart-metin)]">{aciklama}</span>
                <span className="font-mono text-xs font-bold leading-5 text-[var(--kart-metin-soft)]">{lessons.length} ders · {interactions.join(" · ")}</span>
                <span className="text-[15px] font-extrabold text-[var(--kart-metin)]">
                  Bu seviyenin yolunu gör <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[1.25rem] border-[3px] border-poster-ink p-7">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-poster-purple-text">Müfredat haritası</p>
            <h2 className="mt-1 font-heading text-3xl font-extrabold">{tracks.length} hat, birbirine bağlanan robotik</h2>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {tracks.map((track, index) => (
                <Link
                  key={track}
                  href={`/seviye/ortaokul/hat/${track}`}
                  className="group flex min-h-14 items-center gap-3 rounded-xl bg-poster-soft px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:ring-2 hover:ring-poster-ink"
                >
                  <span aria-hidden="true" className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-xs font-bold ${hatRengi(index, tracks.length)}`}>{String.fromCharCode(65 + index)}</span>
                  <span className="flex-1">{HAT_ETIKET[track]}</span>
                  <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                </Link>
              ))}
            </div>
          </div>
          <aside className="capstone-panel flex flex-col justify-between gap-6 rounded-[1.25rem] p-7">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-poster-teal">Capstone deneyi</p>
              <h2 className="mt-1 font-heading text-3xl font-extrabold">Tek robot hücresi, dört mini görev.</h2>
              <p className="mt-3 text-sm leading-6 opacity-80">Kalibrasyon, rota seçimi, program sırası ve güvenli hız kararını aynı eğitim sahnesinde dene. İndirdiğin dosya bir deney kaydıdır; doğrulanmış beceri belgesi değildir.</p>
            </div>
            <Link href="/laboratuvar/robot-hucresi" className="inline-flex min-h-13 items-center justify-center rounded-full bg-poster-teal px-5 py-3 text-[15px] font-extrabold text-[#0a0a0a]">
              Capstone’u başlat <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </aside>
        </section>

        <section aria-label="Platform sayıları" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[[publishedLessons.length, "yayında ders"], [interactiveCount, "etkileşim bileşenli ders"], [tracks.length, "öğrenme hattı"], [sourceCount, "listelenen kaynak"]].map(([value, label]) => (
            <div key={String(label)} className="rounded-2xl bg-poster-soft py-5 text-center">
              <strong className="block font-heading text-5xl font-black leading-none">{value}</strong>
              <span className="mt-1.5 block text-xs text-poster-subtle">{label}</span>
            </div>
          ))}
        </section>
        {allLessons.length > publishedLessons.length && (
          <p className="-mt-12 text-center text-xs text-poster-subtle">{allLessons.length - publishedLessons.length} taslak içerik production sayfalarına dahil değildir.</p>
        )}
      </div>
    </main>
  );
}
