import Link from "next/link";
import type { Lesson, Seviye } from "@/lib/content";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

interface LessonNavProps {
  previous: Lesson | null;
  next: Lesson | null;
  seviye: Seviye;
}

export function LessonNav({ previous, next, seviye }: LessonNavProps) {
  const theme = SEVIYE_THEME[seviye];

  return (
    <nav className={`mt-10 flex flex-col gap-6 border-t pt-6 text-sm ${theme.border}`}>
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
