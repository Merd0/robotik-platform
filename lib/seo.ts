import type { Metadata } from "next";
import type { Lesson } from "@/lib/content";
import { hatEtiket, SEVIYE_ETIKET } from "@/lib/content";

export const SITE_URL = "https://robotik-platform.vercel.app";
export const SITE_NAME = "Robotik Laboratuvarı";

export function absoluteUrl(pathname: string): string {
  return pathname === "/" ? SITE_URL : `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  index?: boolean;
}

/**
 * İndekslenebilir her sayfada aynı eksiksiz metadata sözleşmesini kullanır.
 * Alanların değeri yine sayfanın kendisine aittir; bu yardımcı jenerik metin
 * üretmez, yalnız canonical/OG/Twitter alanlarının unutulmasını engeller.
 */
export function createPageMetadata({
  title,
  description,
  path,
  type = "website",
  index = true,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url,
      title,
      description,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}

export function lessonUrl(slug: string): string {
  return `${SITE_URL}/ders/${slug}`;
}

interface LearningResourceJsonLdOptions {
  name: string;
  description: string;
  path: string;
  learningResourceType: string;
}

export function learningResourceJsonLd({
  name,
  description,
  path,
  learningResourceType,
}: LearningResourceJsonLdOptions) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "@id": url,
    url,
    name,
    description,
    inLanguage: "tr",
    isAccessibleForFree: true,
    learningResourceType,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function lessonJsonLd(lesson: Lesson, prerequisiteSlugs: string[]) {
  const description = lesson.frontmatter.kazanimlar[0];

  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
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
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

interface PageCollectionJsonLdOptions {
  name: string;
  description: string;
  path: string;
  items: readonly { name: string; path: string }[];
}

/** Yalnız sayfada gerçekten görünen bağlantıları CollectionPage/ItemList yapar. */
export function pageCollectionJsonLd({
  name,
  description,
  path,
  items,
}: PageCollectionJsonLdOptions) {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    url,
    name,
    description,
    inLanguage: "tr",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(item.path),
        name: item.name,
      })),
    },
  };
}
