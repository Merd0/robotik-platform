import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicTracksByLevel, hatEtiket, SEVIYE_ETIKET, type Seviye } from "@/lib/content";
import { LessonProgressBadge } from "@/components/ui/LessonProgressBadge";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";
import { computeTeachingHash } from "@/lib/lessonArtifact";
import { seviyeVerisi } from "@/components/seviye/seviyeVerisi";
import { LiseSeviyesi } from "@/components/seviye/LiseSeviyesi";
import { UniversiteSeviyesi } from "@/components/seviye/UniversiteSeviyesi";

const VALID_SEVIYELER: Seviye[] = ["ortaokul", "lise", "universite"];
const LEVEL_COPY: Record<Seviye, { eyebrow: string; body: string }> = {
  ortaokul: { eyebrow: "Gör · Oyna · Açıkla", body: "Formülden önce hareketi kurcala; gözlediğin nedeni kendi sözlerinle anlat." },
  lise: { eyebrow: "Modelle · Ölç · Kodla", body: "Sezgiyi vektör, grafik ve küçük kod deneyleriyle ölçülebilir hale getir." },
  universite: { eyebrow: "Türet · Sına · Sınırını bul", body: "Matematiksel modeli karşı örnek, tekillik ve gerçek uygulama kısıtlarıyla zorla." },
};

export function generateStaticParams() {
  return VALID_SEVIYELER.map((seviye) => ({ seviye }));
}

export async function generateMetadata({ params }: { params: Promise<{ seviye: string }> }): Promise<Metadata> {
  const { seviye } = await params;
  if (!VALID_SEVIYELER.includes(seviye as Seviye)) return {};
  return { title: `${SEVIYE_ETIKET[seviye as Seviye]} laboratuvarı` };
}

/*
 * Üç seviye tek düzenle değil, üç ayrı düzenle sunuluyor. Gerekçe docs/05
 * Bölüm 1: alttaki etkileşim aynı kalır ama çerçeveleme seviyeyle
 * ciddileşir — ortaokul oyun, lise keşif, üniversite referans gibi durur.
 * Veri hazırlığı ortak (seviyeVerisi), farklı olan yalnız sunum.
 *
 * Ortaokul henüz eski ortak düzende; kendi tasarımına geçirilince
 * aşağıdaki OrtakSeviyeDuzeni tamamen kalkacak.
 */
export default async function SeviyePage({ params }: { params: Promise<{ seviye: string }> }) {
  const { seviye } = await params;
  if (!VALID_SEVIYELER.includes(seviye as Seviye)) notFound();
  const level = seviye as Seviye;

  if (level === "universite") return <UniversiteSeviyesi veri={seviyeVerisi(level)} />;
  if (level === "lise") return <LiseSeviyesi veri={seviyeVerisi(level)} />;
  return <OrtakSeviyeDuzeni level={level} />;
}

function OrtakSeviyeDuzeni({ level }: { level: Seviye }) {
  const tracks = getPublicTracksByLevel(level).map((track) => ({ ...track, lessons: track.lessons.filter((lesson) => lesson.frontmatter.durum === "yayinda") })).filter((track) => track.lessons.length > 0);
  const theme = SEVIYE_THEME[level];
  const lessonCount = tracks.reduce((sum, track) => sum + track.lessons.length, 0);

  return (
    <main id="ana-icerik" data-seviye={level} className={`min-h-screen ${theme.page}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="İçerik yolu" className={`flex items-center gap-2 text-sm ${theme.muted}`}><Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvar</Link> <span aria-hidden="true">/</span> {SEVIYE_ETIKET[level]}</nav>
        <header className="mt-8 grid gap-6 lg:grid-cols-[1fr_.45fr] lg:items-end">
          <div><p className={`text-xs font-semibold uppercase tracking-[.18em] ${theme.accentText}`}>{LEVEL_COPY[level].eyebrow}</p><h1 className={`mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-6xl ${theme.ink}`}>{SEVIYE_ETIKET[level]} laboratuvarı</h1><p className={`mt-4 max-w-2xl text-lg leading-7 ${theme.muted}`}>{LEVEL_COPY[level].body}</p></div>
          <div className={`rounded-2xl border p-5 ${theme.border} ${theme.surface}`}><strong className="block font-heading text-3xl">{lessonCount}</strong><span className={theme.muted}>yayında ders · {tracks.length} aktif hat</span></div>
        </header>

        <section className="mt-10 space-y-4" aria-label="Öğrenme hatları">
          {tracks.map(({ hat, lessons }, index) => (
            <article key={hat} className={`group rounded-2xl border ${theme.border} ${theme.surface}`}>
              <Link href={`/seviye/${level}/hat/${hat}`} className="grid min-h-36 gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-site-strong font-mono text-site-on-strong">{String.fromCharCode(65 + index)}</span>
                <span><span className={`block font-heading text-xl font-semibold ${theme.ink}`}>{hatEtiket(hat)}</span><span className={`mt-1 block text-sm ${theme.muted}`}>{lessons.length} ders · {lessons.reduce((sum, lesson) => sum + lesson.frontmatter.sure, 0)} dakika</span><span className="mt-3 flex flex-wrap gap-2">{lessons.slice(0, 3).map((lesson) => <span key={lesson.slug} className="rounded-full bg-site-soft px-2.5 py-1 text-xs text-site-muted">{lesson.frontmatter.baslik}</span>)}</span></span>
                <span className={`text-sm font-semibold ${theme.accentText}`}>Hattı aç <span aria-hidden="true">→</span></span>
              </Link>
              <div className="sr-only">{lessons.map((lesson) => <LessonProgressBadge key={lesson.slug} slug={lesson.slug} seviye={level} contentVersion={computeTeachingHash(lesson)} />)}</div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
