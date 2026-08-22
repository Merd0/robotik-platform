import type { ReactNode } from "react";
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
  resolveLessonSablon,
  SEVIYE_ETIKET,
} from "@/lib/content";
import { splitLessonBody, type LessonSectionName } from "@/lib/lessonSections";
import { mdxComponents } from "@/components/interactive";
import { LessonNav } from "@/components/ui/LessonNav";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";
import { LessonCompletionPanel } from "@/components/lesson/LessonCompletionPanel";
import { LessonTrustPanel } from "@/components/lesson/LessonTrustPanel";
import { LessonPrerequisiteNotice } from "@/components/lesson/LessonPrerequisiteNotice";
import { LessonRelatedTerms } from "@/components/lesson/LessonRelatedTerms";
import { getSeoAnchorTermsInText } from "@/lib/sozluk";
import { JsonLd } from "@/components/seo/JsonLd";
import { computeTeachingHash } from "@/lib/lessonArtifact";
import { computeLessonContentVersion } from "@/lib/interactionManifest";
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

/**
 * Bir MDX kaynağını (tam ders gövdesi ya da `lib/lessonSections.ts`teki
 * tek bir dilim) derler. `blockJS` varsayılanı MDX'teki tüm JS ifadelerini
 * (obje/array prop'ları dahil) siler — bu, üçüncü taraf/kullanıcı girdisi
 * MDX'i için bir güvenlik varsayılanı. Bizim içeriğimiz kullanıcı girdisi
 * değil; sürüm kontrollü depo içeriği ve MDX güvenlik kontrolünden geçiyor,
 * o yüzden kapatıyoruz. `blockDangerousJS` varsayılan açık kalır (eval vb.
 * hâlâ engellenir).
 */
async function compileLessonSection(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      blockJS: false,
      mdxOptions: { remarkPlugins: [remarkGfm] },
    },
  });
  return content;
}

export default async function DersPage({ params }: DersPageProps) {
  const { slug } = await params;
  const lesson = getPublicLessonBySlug(slug);
  if (!lesson) notFound();

  const seviye = lesson.frontmatter.seviye;
  const theme = SEVIYE_THEME[seviye];

  // "kesif" (varsayılan) İÇİN DAVRANIŞ HİÇ DEĞİŞMEZ: tek compileMDX çağrısı,
  // docs/04'ün 6 bölümü yazıldığı sırayla render edilir — bu dal 94 dersin
  // bugün hepsinde çalışan, önceki koddan birebir aynı yol.
  //
  // "gorev" şablonu İÇİN: docs/04'ün İÇERİĞİ (başlıklar, metin, predicate
  // bağlı bileşenler) DEĞİŞMEZ — yalnız "Dene" dilimi (görev tanımı, varsa
  // TransferChallenge) Kanca'nın hemen ardına alınır; Ne oldu/Gerçek
  // dünyada/Sonraki aynı sırada, görevden SONRA gelir (bkz. docs/durum-
  // denetim.md "Faz 1" taksonomisi, madde A/B). `splitLessonBody` docs/04'ün
  // 5 sabit başlığıyla eşleşmeyen bir gövdede (bkz. o dosyanın güvenlik ağı
  // notu) `null` döner — bu durumda da "kesif" yoluna (bölünmemiş render)
  // düşülür, sayfa asla çökmez.
  const sablon = resolveLessonSablon(lesson.frontmatter.sablon);
  const sections = sablon === "gorev" ? splitLessonBody(lesson.body) : null;

  let content: ReactNode;

  if (sections) {
    const sira: LessonSectionName[] = ["Kanca", "Dene", "Ne oldu", "Gerçek dünyada", "Sonraki"];
    const [kanca, dene, neOldu, gercekDunyada, sonraki] = await Promise.all(
      sira.map((baslik) => compileLessonSection(sections[baslik])),
    );
    content = (
      <>
        {kanca}
        <div className={`ders-gorev-kutusu rounded-xl border-2 ${theme.border} ${theme.surface} p-4`}>
          <p className={`font-mono text-xs font-bold uppercase tracking-[0.14em] ${theme.accentText}`}>Önce dene</p>
          {dene}
        </div>
        {neOldu}
        {gercekDunyada}
        {sonraki}
      </>
    );
  } else {
    content = await compileLessonSection(lesson.body);
  }

  const prerequisites = getPrerequisites(lesson);
  const { previous, next } = getAdjacentLessons(lesson);
  const jsonLd = lessonJsonLd(lesson, prerequisites.map((prerequisite) => prerequisite.slug));
  const relatedTerms = getSeoAnchorTermsInText(lesson.body);

  return (
    <main id="ana-icerik" data-seviye={seviye} className={`min-h-screen ${theme.page}`}>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <LessonEvidenceProvider
          lessonId={lesson.slug}
          contentVersion={computeLessonContentVersion(lesson.slug, lesson.body, computeTeachingHash(lesson))}
        >
          <nav aria-label="İçerik yolu" className={`flex flex-wrap items-center gap-2 text-sm ${theme.muted}`}><Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvar</Link><span>/</span><Link href={`/seviye/${seviye}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{SEVIYE_ETIKET[seviye]}</Link><span>/</span><Link href={`/seviye/${seviye}/hat/${lesson.frontmatter.hat}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{hatEtiket(lesson.frontmatter.hat)}</Link></nav>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-[.18em] ${theme.accentText}`}>Deney dersi · {lesson.frontmatter.sure} dakika</p>
              <h1 className={`mt-3 max-w-4xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl ${theme.ink}`}>{lesson.frontmatter.baslik}</h1>
              <LessonPrerequisiteNotice prerequisites={prerequisites} seviye={seviye} />
              <article className="ders-icerik mt-8 flex min-w-0 flex-col gap-5">{content}</article>
              <div className="mt-10"><LessonCompletionPanel seviye={seviye} /></div>
              <LessonRelatedTerms terms={relatedTerms} />
              <LessonNav previous={previous} next={next} seviye={seviye} />
            </div>
            <LessonTrustPanel lesson={lesson} />
          </div>
        </LessonEvidenceProvider>
      </div>
    </main>
  );
}
