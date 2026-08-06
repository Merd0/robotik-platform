import Link from "next/link";
import type { Lesson, Seviye } from "@/lib/content";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

interface LessonNavProps {
  prerequisites: Lesson[];
  previous: Lesson | null;
  next: Lesson | null;
  seviye: Seviye;
}

export function LessonNav({ prerequisites, previous, next, seviye }: LessonNavProps) {
  const theme = SEVIYE_THEME[seviye];

  return (
    <nav className={`mt-10 flex flex-col gap-6 border-t pt-6 text-sm ${theme.border}`}>
      {prerequisites.length > 0 && (
        <div>
          <p className={theme.muted}>Bunu anlamak için önce şunu gör:</p>
          <ul className="mt-1 flex flex-col gap-1">
            {prerequisites.map((lesson) => (
              <li key={lesson.slug}>
                <Link
                  href={`/ders/${lesson.slug}`}
                  className={`inline-flex min-h-11 items-center underline ${theme.accentText}`}
                >
                  {lesson.frontmatter.baslik}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {previous ? (
          <Link
            href={`/ders/${previous.slug}`}
            className={`inline-flex min-h-11 items-center underline ${theme.accentText}`}
          >
            ← {previous.frontmatter.baslik}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/ders/${next.slug}`}
            className={`inline-flex min-h-11 items-center text-right underline ${theme.accentText}`}
          >
            {next.frontmatter.baslik} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}
