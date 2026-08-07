import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";
import {
  getAdjacentLessons,
  getPrerequisites,
  getPublicLessonBySlug,
  getPublicLessons,
} from "@/lib/content";
import { mdxComponents } from "@/components/interactive";
import { LessonNav } from "@/components/ui/LessonNav";
import { CompleteLessonButton } from "@/components/ui/CompleteLessonButton";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

/**
 * Yalnızca herkese açık dersler statik sayfa olarak üretilir. Üretim
 * derlemesinde taslak bir dersin HTML'i hiç oluşmaz — yani slug bilinse bile
 * sayfa yoktur (bkz. `getPublicLessons`).
 */
export function generateStaticParams() {
  return getPublicLessons().map((lesson) => ({ slug: lesson.slug }));
}

interface DersPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Önizleme derlemesinde (ICERIK_TASLAK_ONIZLEME=1) taslak sayfalar
 * üretilebiliyor; o durumda en azından arama motorlarına kapatılsınlar.
 * Üretimde bu sayfalar zaten hiç oluşmuyor.
 */
export async function generateMetadata({ params }: DersPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getPublicLessonBySlug(slug);
  if (!lesson) return {};

  const taslak = lesson.frontmatter.durum !== "yayinda";
  return {
    title: `${lesson.frontmatter.baslik} — Robotik Öğrenme Platformu`,
    ...(taslak ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function DersPage({ params }: DersPageProps) {
  const { slug } = await params;
  const lesson = getPublicLessonBySlug(slug);
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
  const seviye = lesson.frontmatter.seviye;
  const theme = SEVIYE_THEME[seviye];

  return (
    <main data-seviye={seviye} className={`min-h-screen ${theme.page}`}>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className={`text-sm uppercase tracking-wide ${theme.accentText}`}>{seviye}</p>
        <h1 className={`mt-2 text-3xl font-semibold ${theme.ink}`}>{lesson.frontmatter.baslik}</h1>
        <article className="ders-icerik mt-8 flex flex-col gap-5">{content}</article>

        <div className="mt-8">
          <CompleteLessonButton slug={lesson.slug} seviye={seviye} />
        </div>

        <LessonNav prerequisites={prerequisites} previous={previous} next={next} seviye={seviye} />
      </div>
    </main>
  );
}
