import { notFound } from "next/navigation";
import Link from "next/link";
import { getLessonsByLevel, SEVIYE_ETIKET, type Seviye } from "@/lib/content";
import { LessonProgressBadge } from "@/components/ui/LessonProgressBadge";

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-ortaokul-accent-text">Seviye</p>
      <h1 className="mt-2 text-3xl font-semibold text-ortaokul-ink">{SEVIYE_ETIKET[level]}</h1>

      <ul className="mt-8 flex flex-col gap-3">
        {lessons.map((lesson) => (
          <li
            key={lesson.slug}
            className="flex items-center justify-between gap-2 rounded-lg border border-ortaokul-ink/10 p-4"
          >
            <Link href={`/ders/${lesson.slug}`} className="text-ortaokul-accent-text underline">
              {lesson.frontmatter.baslik}
            </Link>
            <LessonProgressBadge slug={lesson.slug} />
          </li>
        ))}
      </ul>

      {lessons.length === 0 && (
        <p className="mt-8 text-ortaokul-ink/70">
          Bu seviyede henüz yayınlanmış ders yok — içerik hazırlanıyor.
        </p>
      )}
    </main>
  );
}
