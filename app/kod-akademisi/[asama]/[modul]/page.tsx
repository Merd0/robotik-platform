import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ASAMA_ETIKET,
  getAdjacentModules,
  getPublicModuleBySlug,
  getPublicModules,
  getPublicModulesByAsama,
  KOD_AKADEMISI_ASAMALAR,
} from "@/lib/kodAkademisi";
import { computeModuleHash } from "@/lib/kodAkademisiArtifact";
import { EVIDENCE_PREDICATES } from "@/lib/evidence";
import { LessonEvidenceProvider } from "@/components/lesson/LessonEvidenceProvider";
import { KodAkademisiCodeLab } from "@/components/kod-akademisi/KodAkademisiCodeLab";
import { Quiz } from "@/components/interactive/Quiz";
import { createPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getPublicModules().map((mod) => ({ asama: mod.frontmatter.asama, modul: mod.slug }));
}

interface ModulePageProps {
  params: Promise<{ asama: string; modul: string }>;
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { modul } = await params;
  const mod = getPublicModuleBySlug(modul);
  if (!mod) return {};
  return createPageMetadata({
    title: `${mod.frontmatter.baslik} · Kod Akademisi`,
    description: mod.frontmatter.kazanimlar[0],
    path: `/kod-akademisi/${mod.frontmatter.asama}/${mod.slug}`,
    type: "article",
  });
}

export default async function KodAkademisiModulePage({ params }: ModulePageProps) {
  const { asama, modul } = await params;
  const mod = getPublicModuleBySlug(modul);
  if (!mod || mod.frontmatter.asama !== asama || !KOD_AKADEMISI_ASAMALAR.includes(mod.frontmatter.asama)) {
    notFound();
  }

  const { content } = await compileMDX({
    source: mod.body,
    // Kod Akademisi modülleri de content/ dersleri gibi birinci taraf,
    // sürüm kontrollü içerik — blockJS varsayılanı (obje/array prop'larını
    // sessizce siler) burada da kapatılıyor, aynı gerekçe:
    // app/ders/[slug]/page.tsx'teki compileMDX çağrısına bkz.
    components: { Quiz },
    options: { parseFrontmatter: false, blockJS: false, mdxOptions: { remarkPlugins: [remarkGfm] } },
  });

  const siradaki = getPublicModulesByAsama(mod.frontmatter.asama);
  const index = siradaki.findIndex((candidate) => candidate.slug === mod.slug);
  const { previous, next } = getAdjacentModules(mod);
  const predicateIds = EVIDENCE_PREDICATES.filter((predicate) => predicate.lessonId === mod.slug).map((predicate) => predicate.id);
  const contentVersion = computeModuleHash({
    frontmatter: mod.frontmatter,
    body: mod.body,
    initialCode: mod.frontmatter.initialCode,
    predicateIds,
  });

  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <LessonEvidenceProvider lessonId={mod.slug} contentVersion={contentVersion}>
          <nav aria-label="İçerik yolu" className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
            <Link href="/kod-akademisi" className="inline-flex min-h-11 items-center underline underline-offset-4">Kod Akademisi</Link>
            <span>/</span>
            <Link href={`/kod-akademisi/${mod.frontmatter.asama}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
              {ASAMA_ETIKET[mod.frontmatter.asama]}
            </Link>
            <span>/</span>
            <span className="inline-flex min-h-11 items-center">Modül {index + 1}/{siradaki.length}</span>
          </nav>

          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {mod.frontmatter.baslik}
          </h1>

          <article className="ders-icerik mt-6 flex max-w-3xl flex-col gap-4">{content}</article>

          <div className="mt-8">
            <KodAkademisiCodeLab
              initialCode={mod.frontmatter.initialCode}
              robot={mod.frontmatter.robot}
              skillId={mod.frontmatter.skillId}
              expectedFinalDegrees={mod.frontmatter.expectedFinalDegrees}
              toleranceDegrees={mod.frontmatter.toleranceDegrees}
              maxTraceSteps={mod.frontmatter.maxTraceSteps}
              ipuclari={mod.frontmatter.ipuclari}
              cozum={mod.frontmatter.cozum}
              showOptimizationMetric={mod.frontmatter.optimizasyonMetrigi === true}
            />
          </div>

          <nav className="mt-10 flex items-center justify-between gap-4 border-t border-site-border pt-6 text-sm">
            {previous ? (
              <Link href={`/kod-akademisi/${previous.frontmatter.asama}/${previous.slug}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
                ← {previous.frontmatter.baslik}
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/kod-akademisi/${next.frontmatter.asama}/${next.slug}`} className="inline-flex min-h-11 items-center text-right underline underline-offset-4">
                {next.frontmatter.baslik} →
              </Link>
            ) : <span />}
          </nav>
        </LessonEvidenceProvider>
      </div>
    </main>
  );
}
