import Link from "next/link";
import { HeroExperiment } from "@/components/home/HeroExperiment";
import { getAllLessons, getPublicLessons, HAT_ETIKET, SEVIYE_ETIKET, type Seviye } from "@/lib/content";

const SEVIYELER: { seviye: Seviye; aciklama: string }[] = [
  { seviye: "ortaokul", aciklama: "Robot kavramı, eklem hareketi ve labirent planlamayı görerek dene." },
  { seviye: "lise", aciklama: "Koordinatlar, iki eklemli kinematik ve rota kararlarını ölçerek açıkla." },
  { seviye: "universite", aciklama: "DH, Jacobian, nümerik IK ve planlayıcıları matematiksel sınırlarıyla sına." },
];

const ETKILESIM_ETIKETI: Record<string, string> = {
  JointSliders: "eklem kontrolü",
  IkTarget: "hedef ve IK",
  JacobianViz: "Jacobian görselleştirme",
  PlannerRace: "planlayıcı karşılaştırma",
  MazePlanner: "labirent planlama",
  PredictionPrompt: "tahmin",
  TransferChallenge: "kavram kontrolü",
};

export default function HomePage() {
  const allLessons = getAllLessons();
  const publishedLessons = getPublicLessons().filter((lesson) => lesson.frontmatter.durum === "yayinda");
  const tracks = [...new Set(publishedLessons.map((lesson) => lesson.frontmatter.hat))];
  const interactiveCount = publishedLessons.filter((lesson) => lesson.frontmatter.etkilesimli.length > 0).length;
  const sourceCount = publishedLessons.reduce((toplam, lesson) => toplam + lesson.frontmatter.kaynaklar.length, 0);
  const levelCards = SEVIYELER.map((card) => {
    const lessons = publishedLessons.filter((lesson) => lesson.frontmatter.seviye === card.seviye);
    const interactions = [...new Set(lessons.flatMap((lesson) => lesson.frontmatter.etkilesimli))]
      .map((name) => ETKILESIM_ETIKETI[name])
      .filter((label): label is string => Boolean(label))
      .slice(0, 3);
    return { ...card, lessons, interactions };
  });

  return (
    <main id="ana-icerik" className="min-h-screen overflow-hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-8 sm:px-6 sm:py-12">
        <HeroExperiment />

        <section aria-labelledby="seviye-baslik" className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-site-accent-text">Aynı laboratuvar, üç derinlik</p>
              <h2 id="seviye-baslik" className="mt-2 font-heading text-3xl font-semibold tracking-tight">Nereden başlamak istiyorsun?</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-site-muted">Seviye yalnızca renk değil; açıklama, matematik, sınır durumları ve kanıt beklentisi birlikte değişir.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {levelCards.map(({ seviye, aciklama, lessons, interactions }) => (
          <Link
            key={seviye}
            href={`/seviye/${seviye}`}
            data-seviye={seviye}
            className="group lab-panel flex min-h-48 flex-col justify-between gap-6 p-5 transition hover:-translate-y-1 hover:border-teal-500"
          >
            <span className="font-heading text-2xl font-semibold text-site-ink">{SEVIYE_ETIKET[seviye]}</span>
            <span className="text-sm leading-6 text-site-muted">{aciklama}</span>
            <span className="text-xs leading-5 text-site-subtle">{lessons.length} ders · {interactions.join(" · ")}</span>
            <span className="rounded-lg border border-site-border bg-site-soft px-2.5 py-2 text-xs text-site-muted">
              Her ders kaynaklarıyla birlikte yayımlanır
            </span>
            <span className="text-sm font-semibold text-site-accent-text">Bu seviyenin yolunu gör <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span>
          </Link>
        ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_.72fr]">
          <div className="lab-panel p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-site-accent-text">Müfredat haritası</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">Tek tek içerikler değil, birbirine bağlanan robotik hatları</h2>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {tracks.map((track, index) => (
                <div key={track} className="flex min-h-14 items-center gap-3 rounded-xl border border-site-border bg-site-soft px-4 py-2 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-site-strong font-mono text-xs text-site-on-strong">{String.fromCharCode(65 + index)}</span>
                  <span className="font-medium text-site-ink">{HAT_ETIKET[track]}</span>
                </div>
              ))}
            </div>
          </div>
          <aside className="lab-panel flex flex-col justify-between gap-6 bg-slate-950 p-6 text-white sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-teal-300">Beta bütünleştirme deneyi</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold">Tek robot hücresi, dört mini görev.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Kalibrasyon, rota seçimi, program sırası ve güvenli hız kararını aynı eğitim sahnesinde dene. İndirdiğin dosya bir deney kaydıdır; doğrulanmış beceri belgesi değildir.</p>
            </div>
            <Link href="/laboratuvar/robot-hucresi" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950">Capstone’u başlat</Link>
          </aside>
        </section>

        <section aria-label="Platform sayıları" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[[publishedLessons.length, "yayında ders"], [interactiveCount, "etkileşim bileşenli ders"], [tracks.length, "öğrenme hattı"], [sourceCount, "listelenen kaynak"]].map(([value, label]) => (
            <div key={String(label)} className="rounded-2xl border border-site-border bg-site-surface p-4"><strong className="block font-heading text-3xl">{value}</strong><span className="text-xs text-site-muted">{label}</span></div>
          ))}
        </section>
        {allLessons.length > publishedLessons.length && (
          <p className="-mt-10 text-center text-xs text-site-subtle">{allLessons.length - publishedLessons.length} taslak içerik production sayfalarına dahil değildir.</p>
        )}
      </div>
    </main>
  );
}
