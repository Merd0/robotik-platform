import type { MetadataRoute } from "next";
import { getPublicLessons, getPublicTracksByLevel, type Seviye } from "@/lib/content";
import { getFileLastModified } from "@/lib/fileModified";
import { KOD_AKADEMISI_ASAMALAR, getPublicModules } from "@/lib/kodAkademisi";
import { SITE_URL } from "@/lib/seo";
import { getSozluk, SOZLUK_FILE_PATH, terimSlug } from "@/lib/sozluk";
import { getIndexableStaticPages } from "@/lib/staticRoutes";

const LEVELS: Seviye[] = ["ortaokul", "lise", "universite"];
export const dynamic = "force-static";

function staticPagePriority(route: string): number {
  if (route === "/") return 1;
  if (route === "/oyun-alani" || route.startsWith("/laboratuvar") || route === "/bilgi-haritasi") return 0.9;
  if (route.startsWith("/ogretmen") || route.startsWith("/kod-akademisi")) return 0.8;
  return 0.7;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const sozlukModified = getFileLastModified(SOZLUK_FILE_PATH);
  const staticPages: MetadataRoute.Sitemap = getIndexableStaticPages().map(({ route, filePath }) => ({
    url: route === "/" ? SITE_URL : `${SITE_URL}${route}`,
    lastModified: route === "/sozluk" ? sozlukModified : getFileLastModified(filePath),
    changeFrequency: route === "/" || route === "/bilgi-haritasi" ? "weekly" : "monthly",
    priority: staticPagePriority(route),
  }));
  const levels: MetadataRoute.Sitemap = LEVELS.map((level) => ({ url: `${SITE_URL}/seviye/${level}`, changeFrequency: "weekly", priority: 0.8 }));
  const tracks: MetadataRoute.Sitemap = LEVELS.flatMap((level) => getPublicTracksByLevel(level).filter((track) => track.lessons.some((lesson) => lesson.frontmatter.durum === "yayinda")).map((track) => ({ url: `${SITE_URL}/seviye/${level}/hat/${track.hat}`, changeFrequency: "weekly" as const, priority: 0.7 })));
  const lessons: MetadataRoute.Sitemap = getPublicLessons().filter((lesson) => lesson.frontmatter.durum === "yayinda").map((lesson) => ({ url: `${SITE_URL}/ders/${lesson.slug}`, lastModified: getFileLastModified(lesson.filePath), changeFrequency: "monthly" as const, priority: 0.7 }));
  const publishedModules = getPublicModules().filter((module) => module.frontmatter.durum === "yayinda");
  const codeStages: MetadataRoute.Sitemap = KOD_AKADEMISI_ASAMALAR
    .filter((stage) => publishedModules.some((module) => module.frontmatter.asama === stage))
    .map((stage) => ({ url: `${SITE_URL}/kod-akademisi/${stage}`, changeFrequency: "monthly" as const, priority: 0.8 }));
  const codeModules: MetadataRoute.Sitemap = publishedModules.map((module) => ({
    url: `${SITE_URL}/kod-akademisi/${module.frontmatter.asama}/${module.slug}`,
    lastModified: getFileLastModified(module.filePath),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const glossaryTerms: MetadataRoute.Sitemap = getSozluk().map((terim) => ({
    url: `${SITE_URL}/sozluk/${terimSlug(terim.tr)}`,
    lastModified: sozlukModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticPages, ...levels, ...tracks, ...lessons, ...codeStages, ...codeModules, ...glossaryTerms];
}
