import type { Lesson } from "@/lib/content";
import { hatEtiket, SEVIYE_ETIKET } from "@/lib/content";

export const SITE_URL = "https://robotik-platform.vercel.app";

export function lessonUrl(slug: string): string {
  return `${SITE_URL}/ders/${slug}`;
}

export function lessonJsonLd(lesson: Lesson, prerequisiteSlugs: string[]) {
  const description = lesson.frontmatter.kazanimlar[0];

  return {
    "@context": "https://schema.org",
    "@type": ["Course", "LearningResource"],
    "@id": lessonUrl(lesson.slug),
    url: lessonUrl(lesson.slug),
    name: lesson.frontmatter.baslik,
    description,
    inLanguage: "tr",
    isAccessibleForFree: true,
    learningResourceType: "Etkileşimli ders",
    educationalLevel: SEVIYE_ETIKET[lesson.frontmatter.seviye],
    timeRequired: `PT${lesson.frontmatter.sure}M`,
    teaches: lesson.frontmatter.kazanimlar,
    about: {
      "@type": "DefinedTerm",
      name: hatEtiket(lesson.frontmatter.hat),
    },
    ...(prerequisiteSlugs.length > 0
      ? { isBasedOn: prerequisiteSlugs.map((slug) => lessonUrl(slug)) }
      : {}),
    provider: {
      "@type": "Organization",
      name: "Robotik Laboratuvarı",
      url: SITE_URL,
    },
  };
}
