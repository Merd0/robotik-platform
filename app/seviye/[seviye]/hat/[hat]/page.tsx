import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicTracksByLevel, hatEtiket, HAT_ETIKET, SEVIYE_ETIKET, type Seviye } from "@/lib/content";
import { LessonProgressBadge } from "@/components/ui/LessonProgressBadge";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

const LEVELS: Seviye[] = ["ortaokul", "lise", "universite"];

export function generateStaticParams() {
  return LEVELS.flatMap((seviye) => getPublicTracksByLevel(seviye)
    .filter((track) => track.lessons.some((lesson) => lesson.frontmatter.durum === "yayinda"))
    .map((track) => ({ seviye, hat: track.hat })));
}

export default async function HatPage({ params }: { params: Promise<{ seviye: string; hat: string }> }) {
  const { seviye, hat } = await params;
  if (!LEVELS.includes(seviye as Seviye) || !(hat in HAT_ETIKET)) notFound();
  const level = seviye as Seviye;
  const lessons = getPublicTracksByLevel(level).find((track) => track.hat === hat)?.lessons.filter((lesson) => lesson.frontmatter.durum === "yayinda") ?? [];
  if (lessons.length === 0) notFound();
  const theme = SEVIYE_THEME[level];

  return (
    <main id="ana-icerik" data-seviye={level} className={`min-h-screen ${theme.page}`}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="İçerik yolu" className={`flex flex-wrap items-center gap-2 text-sm ${theme.muted}`}><Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvar</Link><span>/</span><Link href={`/seviye/${level}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{SEVIYE_ETIKET[level]}</Link><span>/</span><span>{hatEtiket(hat)}</span></nav>
        <header className="mt-8"><p className={`text-xs font-semibold uppercase tracking-[.18em] ${theme.accentText}`}>Öğrenme hattı</p><h1 className={`mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl ${theme.ink}`}>{hatEtiket(hat)}</h1><p className={`mt-3 max-w-2xl leading-7 ${theme.muted}`}>Her durak bir önceki gözlemi kullanır. Okumak başlangıç; denemek ve transfer görevini çözmek gerçek ilerlemedir.</p></header>

        <ol className="relative mt-10 space-y-4 before:absolute before:bottom-8 before:left-6 before:top-8 before:w-px before:bg-site-border sm:before:left-8">
          {lessons.map((lesson, index) => (
            <li key={lesson.slug} className="relative pl-14 sm:pl-20">
              <span aria-hidden="true" className="absolute left-0 top-6 z-10 grid size-12 place-items-center rounded-full border-4 border-site-surface bg-site-strong font-mono text-sm text-site-on-strong sm:left-2">{index + 1}</span>
              <Link href={`/ders/${lesson.slug}`} className={`group flex min-h-28 flex-col justify-center gap-2 rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${theme.border} ${theme.surface}`}>
                <span className="flex items-center justify-between gap-3"><strong className={`font-heading text-lg ${theme.ink}`}>{lesson.frontmatter.baslik}</strong><LessonProgressBadge slug={lesson.slug} seviye={level} /></span>
                <span className={`text-sm ${theme.muted}`}>{lesson.frontmatter.sure} dk · {lesson.frontmatter.kazanimlar[0]}</span>
              </Link>
            </li>
          ))}
        </ol>

        <aside className="mt-12 rounded-2xl bg-slate-950 p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-teal-300">Hatları birleştir</p><h2 className="mt-2 font-heading text-2xl font-semibold">Bu beceriyi robot hücresinde kullan</h2></div><Link href="/laboratuvar/robot-hucresi" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950 sm:mt-0">Capstone’u aç</Link></aside>
      </div>
    </main>
  );
}
