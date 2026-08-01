import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { getAllLessons, getLessonBySlug } from "@/lib/content";
import { mdxComponents } from "@/components/interactive";

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
    options: { parseFrontmatter: false },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-ortaokul-accent">
        {lesson.frontmatter.seviye}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-ortaokul-ink">
        {lesson.frontmatter.baslik}
      </h1>
      <article className="ders-icerik mt-8 flex flex-col gap-5">{content}</article>
    </main>
  );
}
