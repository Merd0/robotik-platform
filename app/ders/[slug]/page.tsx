import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAdjacentLessons, getAllLessons, getLessonBySlug, getPrerequisites } from "@/lib/content";
import { mdxComponents } from "@/components/interactive";
import { LessonNav } from "@/components/ui/LessonNav";
import { CompleteLessonButton } from "@/components/ui/CompleteLessonButton";

export function generateStaticParams() {
  return getAllLessons().map((lesson) => ({ slug: lesson.slug }));
}

interface DersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DersPage({ params }: DersPageProps) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  const { content } = await compileMDX({
    source: lesson.body,
    components: mdxComponents,
    // blockJS varsayılanı MDX'teki tüm JS ifadelerini (obje/array prop'ları
    // dahil) siler — bu, üçüncü taraf/kullanıcı girdisi MDX'i için bir
    // güvenlik varsayılanı. Bizim içeriğimiz güvenilir (yazan biziz, PR
    // incelemesinden geçiyor, bkz. docs/08-guvenlik-sertlestirme.md), o
    // yüzden kapatıyoruz. blockDangerousJS varsayılan açık kalır (eval vb.
    // hâlâ engellenir).
    options: {
      parseFrontmatter: false,
      blockJS: false,
      mdxOptions: { remarkPlugins: [remarkGfm] },
    },
  });

  const prerequisites = getPrerequisites(lesson);
  const { previous, next } = getAdjacentLessons(lesson);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-ortaokul-accent-text">
        {lesson.frontmatter.seviye}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-ortaokul-ink">
        {lesson.frontmatter.baslik}
      </h1>
      <article className="ders-icerik mt-8 flex flex-col gap-5">{content}</article>

      <div className="mt-8">
        <CompleteLessonButton slug={lesson.slug} />
      </div>

      <LessonNav prerequisites={prerequisites} previous={previous} next={next} />
    </main>
  );
}
