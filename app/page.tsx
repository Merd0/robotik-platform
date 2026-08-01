import Link from "next/link";
import { getAllLessons } from "@/lib/content";

export default function HomePage() {
  const lessons = getAllLessons();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold text-ortaokul-ink">
        Robotik Öğrenme Platformu
      </h1>
      <p className="text-ortaokul-ink/80">
        Robotiği tarayıcıda oynayarak öğreten, açık ve ücretsiz bir Türkçe
        kaynak. Şu an inşa halinde — ilk ders aşağıda.
      </p>
      <ul className="flex flex-col gap-3">
        {lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              href={`/ders/${lesson.slug}`}
              className="text-ortaokul-accent underline decoration-2 underline-offset-4"
            >
              {lesson.frontmatter.baslik}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
