import Link from "next/link";
import type { Lesson, Seviye } from "@/lib/content";
import { hatEtiket } from "@/lib/content";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

interface LessonNavProps {
  previous: Lesson | null;
  next: Lesson | null;
  seviye: Seviye;
  currentHat: string;
}

/**
 * `next`, mevcut hattın 3 seviyesi de tükendiğinde (`getAdjacentLessons`,
 * FAZ 2) bir sonraki hattın ilk dersine sıçrayabilir. Bu durumda düz "→"
 * oku yeterince açık değil — öğrenci aynı hatta kaldığını sanabilir. Hat
 * değiştiğinde küçük bir "Sıradaki hat" etiketiyle bunu açıkça söylüyoruz.
 */
export function LessonNav({ previous, next, seviye, currentHat }: LessonNavProps) {
  const theme = SEVIYE_THEME[seviye];
  const nextHatDegisiyor = next !== null && next.frontmatter.hat !== currentHat;

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
            className={`inline-flex min-h-11 flex-col items-end text-right underline ${theme.accentText}`}
          >
            {nextHatDegisiyor && (
              <span className={`text-xs font-semibold uppercase tracking-[.12em] no-underline ${theme.muted}`}>
                Sıradaki hat: {hatEtiket(next.frontmatter.hat)}
              </span>
            )}
            <span>{next.frontmatter.baslik} →</span>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}
