import Link from "next/link";
import type { Lesson } from "@/lib/content";

interface LessonNavProps {
  prerequisites: Lesson[];
  previous: Lesson | null;
  next: Lesson | null;
}

export function LessonNav({ prerequisites, previous, next }: LessonNavProps) {
  return (
    <nav className="mt-10 flex flex-col gap-6 border-t border-ortaokul-ink/10 pt-6 text-sm">
      {prerequisites.length > 0 && (
        <div>
          <p className="text-ortaokul-ink/60">Bunu anlamak için önce şunu gör:</p>
          <ul className="mt-1 flex flex-col gap-1">
            {prerequisites.map((lesson) => (
              <li key={lesson.slug}>
                <Link href={`/ders/${lesson.slug}`} className="text-ortaokul-accent underline">
                  {lesson.frontmatter.baslik}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {previous ? (
          <Link href={`/ders/${previous.slug}`} className="text-ortaokul-accent underline">
            ← {previous.frontmatter.baslik}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/ders/${next.slug}`} className="text-ortaokul-accent underline">
            {next.frontmatter.baslik} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}
