import type { MetadataRoute } from "next";
import { getPublicLessons, getPublicTracksByLevel, type Seviye } from "@/lib/content";

const BASE = "https://robotik-platform.vercel.app";
const LEVELS: Seviye[] = ["ortaokul", "lise", "universite"];
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/ara`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/sozluk`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/laboratuvar/robot-hucresi`, changeFrequency: "monthly", priority: 0.9 },
  ];
  const levels: MetadataRoute.Sitemap = LEVELS.map((level) => ({ url: `${BASE}/seviye/${level}`, changeFrequency: "weekly", priority: 0.8 }));
  const tracks: MetadataRoute.Sitemap = LEVELS.flatMap((level) => getPublicTracksByLevel(level).filter((track) => track.lessons.some((lesson) => lesson.frontmatter.durum === "yayinda")).map((track) => ({ url: `${BASE}/seviye/${level}/hat/${track.hat}`, changeFrequency: "weekly" as const, priority: 0.7 })));
  const lessons: MetadataRoute.Sitemap = getPublicLessons().filter((lesson) => lesson.frontmatter.durum === "yayinda").map((lesson) => ({ url: `${BASE}/ders/${lesson.slug}`, lastModified: lesson.frontmatter.incelendi_tarih, changeFrequency: "monthly" as const, priority: 0.7 }));
  return [...staticPages, ...levels, ...tracks, ...lessons];
}
