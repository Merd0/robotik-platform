import Link from "next/link";
import type { Lesson, Seviye } from "@/lib/content";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

export function LessonPrerequisiteNotice({ prerequisites, seviye }: { prerequisites: readonly Lesson[]; seviye: Seviye }) {
  const theme = SEVIYE_THEME[seviye];

  return (
    <section aria-labelledby="uygunluk-baslik" className="mt-8 max-w-3xl rounded-2xl border border-warning-border bg-warning-surface p-5 text-warning-ink">
      <p className="text-xs font-semibold uppercase tracking-[.14em]">Başlamadan önce</p>
      <h2 id="uygunluk-baslik" className="mt-1 font-heading text-2xl font-semibold">Bu ders sana uygun mu?</h2>
      {prerequisites.length > 0 ? (
        <>
          <p className="mt-2 text-sm leading-6">Bu ders aşağıdaki kavramları kullanır. Tanıdık gelmiyorsa önce bunlara göz at:</p>
          <ul className="mt-2 flex flex-col gap-1">
            {prerequisites.map((lesson) => (
              <li key={lesson.slug}>
                <Link href={`/ders/${lesson.slug}`} className={`inline-flex min-h-11 items-center font-semibold underline underline-offset-4 ${theme.accentText}`}>
                  {lesson.frontmatter.baslik}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm leading-6">Bu ders için yayımlanmış bir ön koşul yok; doğrudan deneye başlayabilirsin.</p>
      )}
    </section>
  );
}
