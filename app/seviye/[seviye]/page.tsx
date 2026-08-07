import { notFound } from "next/navigation";
import Link from "next/link";
import { getLessonsByLevel, SEVIYE_ETIKET, type Seviye } from "@/lib/content";
import { LessonProgressBadge } from "@/components/ui/LessonProgressBadge";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

const VALID_SEVIYELER: Seviye[] = ["ortaokul", "lise", "universite"];

export function generateStaticParams() {
  return VALID_SEVIYELER.map((seviye) => ({ seviye }));
}

interface SeviyePageProps {
  params: Promise<{ seviye: string }>;
}

export default async function SeviyePage({ params }: SeviyePageProps) {
  const { seviye } = await params;
  if (!VALID_SEVIYELER.includes(seviye as Seviye)) notFound();

  const level = seviye as Seviye;
  // Sadece insan gözden geçirmesinden geçmiş dersler herkese açık listede
  // görünür — bkz. CLAUDE.md "Yapay zeka üretimi bir ders, insan gözden
  // geçirmesi olmadan yayınlanamaz". Taslak dersler doğrudan URL ile
  // (önizleme amaçlı) hâlâ açılabilir.
  const lessons = getLessonsByLevel(level).filter((lesson) => lesson.frontmatter.durum === "yayinda");
  const theme = SEVIYE_THEME[level];

  return (
    <main data-seviye={level} className={`min-h-screen ${theme.page}`}>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className={`text-sm uppercase tracking-wide ${theme.accentText}`}>Seviye</p>
        <h1 className={`mt-2 text-3xl font-semibold ${theme.ink}`}>{SEVIYE_ETIKET[level]}</h1>

        <ul className="mt-8 flex flex-col gap-3">
          {lessons.map((lesson) => (
            <li
              key={lesson.slug}
              className={`flex items-center justify-between gap-2 rounded-lg border p-4 ${theme.border} ${theme.surface}`}
            >
              <Link
                href={`/ders/${lesson.slug}`}
                className={`inline-flex min-h-11 items-center underline ${theme.accentText}`}
              >
                {lesson.frontmatter.baslik}
              </Link>
              <LessonProgressBadge slug={lesson.slug} seviye={level} />
            </li>
          ))}
        </ul>

        {lessons.length === 0 && (
          <p className={`mt-8 ${theme.muted}`}>
            Bu seviyede henüz yayınlanmış ders yok — içerik hazırlanıyor.
          </p>
        )}
      </div>
    </main>
  );
}
