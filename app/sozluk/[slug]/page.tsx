import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getPublishedLessonsByTrack,
  hatEtiket,
  SEVIYE_ETIKET,
  type Seviye,
} from "@/lib/content";
import { createPageMetadata, SITE_URL } from "@/lib/seo";
import { getSozluk, getTerimBySlug, terimSlug } from "@/lib/sozluk";

const SEVIYELER: Seviye[] = ["ortaokul", "lise", "universite"];

interface SozlukTerimPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getSozluk().map((terim) => ({ slug: terimSlug(terim.tr) }));
}

export async function generateMetadata({ params }: SozlukTerimPageProps): Promise<Metadata> {
  const { slug } = await params;
  const terim = getTerimBySlug(slug);
  if (!terim) return {};

  const title = `${terim.tr} nedir?`;
  const description = `${terim.tr} (${terim.en}): ${terim.tanim}`;
  return createPageMetadata({
    title,
    description,
    path: `/sozluk/${slug}`,
    type: "article",
  });
}

export default async function SozlukTerimPage({ params }: SozlukTerimPageProps) {
  const { slug } = await params;
  const terim = getTerimBySlug(slug);
  if (!terim) notFound();

  const ilgiliDersler = getPublishedLessonsByTrack(terim.hat);
  const url = `${SITE_URL}/sozluk/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": url,
    url,
    name: terim.tr,
    alternateName: terim.en,
    description: terim.tanim,
    inLanguage: "tr",
    termCode: slug,
    inDefinedTermSet: `${SITE_URL}/sozluk`,
    ...(ilgiliDersler.length > 0
      ? { subjectOf: ilgiliDersler.map((lesson) => `${SITE_URL}/ders/${lesson.slug}`) }
      : {}),
  };

  return (
    <main id="ana-icerik" className="min-h-screen bg-ortaokul-bg text-ortaokul-ink">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <nav aria-label="İçerik yolu" className="flex flex-wrap items-center gap-2 text-sm text-ortaokul-ink/70">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvar</Link>
          <span>/</span>
          <Link href="/sozluk" className="inline-flex min-h-11 items-center underline underline-offset-4">Sözlük</Link>
        </nav>

        <article className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-ortaokul-accent-text">
            {hatEtiket(terim.hat)}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{terim.tr}</h1>
          <p lang="en" className="mt-3 font-mono text-base text-ortaokul-ink/65">{terim.en}</p>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-ortaokul-ink/85">{terim.tanim}</p>
        </article>

        {terim.karisan && (
          <section aria-labelledby="siklikla-karisir" className="mt-10 max-w-2xl rounded-2xl border border-warning-border bg-warning-surface p-6">
            <h2 id="siklikla-karisir" className="font-heading text-lg font-semibold text-warning-ink">
              Sıkça karıştırılır:{" "}
              {terim.karisan.slug ? (
                <Link href={`/sozluk/${terim.karisan.slug}`} className="underline underline-offset-4">
                  {terim.karisan.terim}
                </Link>
              ) : (
                terim.karisan.terim
              )}
            </h2>
            <p className="mt-2 leading-7 text-warning-ink/90">{terim.karisan.fark}</p>
          </section>
        )}

        <section aria-labelledby="ilgili-dersler" className="mt-12 border-t border-ortaokul-ink/15 pt-8">
          <h2 id="ilgili-dersler" className="font-heading text-2xl font-semibold">İlgili dersler</h2>
          {ilgiliDersler.length > 0 ? (
            <div className="mt-5 grid gap-6 sm:grid-cols-3">
              {SEVIYELER.map((seviye) => {
                const dersler = ilgiliDersler.filter((lesson) => lesson.frontmatter.seviye === seviye);
                if (dersler.length === 0) return null;
                return (
                  <div key={seviye}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-ortaokul-ink/70">
                      {SEVIYE_ETIKET[seviye]}
                    </h3>
                    <ul className="mt-3 space-y-3">
                      {dersler.map((lesson) => (
                        <li key={lesson.slug}>
                          <Link href={`/ders/${lesson.slug}`} className="text-sm text-ortaokul-accent-text underline underline-offset-4">
                            {lesson.frontmatter.baslik}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-ortaokul-ink/75">
              Bu konu hattında yayımlanmış bir ders olduğunda burada listelenecek.
            </p>
          )}
        </section>

        <Link
          href={`/sozluk#${terim.hat}`}
          className="mt-12 inline-flex min-h-11 items-center text-sm font-medium text-ortaokul-accent-text underline underline-offset-4"
        >
          {hatEtiket(terim.hat)} terimlerinin tümünü gör
        </Link>
      </div>
    </main>
  );
}
