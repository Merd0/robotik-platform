import type { MetadataRoute } from "next";
import { getPublicLessons, getPublicTracksByLevel, type Seviye } from "@/lib/content";
import { getFileLastModified } from "@/lib/fileModified";
import { SITE_URL } from "@/lib/seo";
import { getSozluk, SOZLUK_FILE_PATH, terimSlug } from "@/lib/sozluk";

const LEVELS: Seviye[] = ["ortaokul", "lise", "universite"];
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const sozlukModified = getFileLastModified(SOZLUK_FILE_PATH);
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/ara`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/oyun-alani`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/ogretmen`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/sozluk`, lastModified: sozlukModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/laboratuvar/robot-hucresi`, changeFrequency: "monthly", priority: 0.9 },
  ];
  const levels: MetadataRoute.Sitemap = LEVELS.map((level) => ({ url: `${SITE_URL}/seviye/${level}`, changeFrequency: "weekly", priority: 0.8 }));
  const tracks: MetadataRoute.Sitemap = LEVELS.flatMap((level) => getPublicTracksByLevel(level).filter((track) => track.lessons.some((lesson) => lesson.frontmatter.durum === "yayinda")).map((track) => ({ url: `${SITE_URL}/seviye/${level}/hat/${track.hat}`, changeFrequency: "weekly" as const, priority: 0.7 })));
  const lessons: MetadataRoute.Sitemap = getPublicLessons().filter((lesson) => lesson.frontmatter.durum === "yayinda").map((lesson) => ({ url: `${SITE_URL}/ders/${lesson.slug}`, lastModified: getFileLastModified(lesson.filePath), changeFrequency: "monthly" as const, priority: 0.7 }));
  const glossaryTerms: MetadataRoute.Sitemap = getSozluk().map((terim) => ({
    url: `${SITE_URL}/sozluk/${terimSlug(terim.tr)}`,
    lastModified: sozlukModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticPages, ...levels, ...tracks, ...lessons, ...glossaryTerms];
}
