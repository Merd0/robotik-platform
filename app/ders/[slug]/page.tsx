import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";
import {
  getAdjacentLessons,
  getPrerequisites,
  getPublicLessonBySlug,
  getPublicLessons,
  hatEtiket,
  SEVIYE_ETIKET,
} from "@/lib/content";
import { mdxComponents } from "@/components/interactive";
import { LessonNav } from "@/components/ui/LessonNav";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";
import { LessonCompletionPanel } from "@/components/lesson/LessonCompletionPanel";
import { LessonTrustPanel } from "@/components/lesson/LessonTrustPanel";
import { JsonLd } from "@/components/seo/JsonLd";
import { computeTeachingHash } from "@/lib/lessonArtifact";
import { lessonJsonLd, lessonUrl } from "@/lib/seo";
import Link from "next/link";

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
  const description = lesson.frontmatter.kazanimlar[0];
  const url = lessonUrl(lesson.slug);
  return {
    title: lesson.frontmatter.baslik,
    description,
    alternates: { canonical: `/ders/${lesson.slug}` },
    openGraph: {
      type: "article",
      locale: "tr_TR",
      url,
      title: lesson.frontmatter.baslik,
      description,
    },
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
  const jsonLd = lessonJsonLd(lesson, prerequisites.map((prerequisite) => prerequisite.slug));

  return (
    <main id="ana-icerik" data-seviye={seviye} className={`min-h-screen ${theme.page}`}>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <LessonEvidenceProvider lessonId={lesson.slug} contentVersion={computeTeachingHash(lesson)}>
          <nav aria-label="İçerik yolu" className={`flex flex-wrap items-center gap-2 text-sm ${theme.muted}`}><Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvar</Link><span>/</span><Link href={`/seviye/${seviye}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{SEVIYE_ETIKET[seviye]}</Link><span>/</span><Link href={`/seviye/${seviye}/hat/${lesson.frontmatter.hat}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{hatEtiket(lesson.frontmatter.hat)}</Link></nav>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-[.18em] ${theme.accentText}`}>Deney dersi · {lesson.frontmatter.sure} dakika</p>
              <h1 className={`mt-3 max-w-4xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl ${theme.ink}`}>{lesson.frontmatter.baslik}</h1>
              <article className="ders-icerik mt-8 flex min-w-0 flex-col gap-5">{content}</article>
              <div className="mt-10"><LessonCompletionPanel seviye={seviye} /></div>
              <LessonNav prerequisites={prerequisites} previous={previous} next={next} seviye={seviye} />
            </div>
            <LessonTrustPanel lesson={lesson} />
          </div>
        </LessonEvidenceProvider>
      </div>
    </main>
  );
}
