import type { MetadataRoute } from "next";
import { getPublishedLessons } from "../lib/content";

const SITE_URL = "https://robotik-platform.vercel.app";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/ara`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/sozluk`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/seviye/ortaokul`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/seviye/lise`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/seviye/universite`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const lessonRoutes: MetadataRoute.Sitemap = getPublishedLessons().map((lesson) => ({
    url: `${SITE_URL}/ders/${lesson.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...lessonRoutes];
}
