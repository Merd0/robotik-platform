import { afterEach, describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";
import { getAllLessons } from "./content";

const ORIJINAL_ONIZLEME = process.env.ICERIK_TASLAK_ONIZLEME;

afterEach(() => {
  if (ORIJINAL_ONIZLEME === undefined) delete process.env.ICERIK_TASLAK_ONIZLEME;
  else process.env.ICERIK_TASLAK_ONIZLEME = ORIJINAL_ONIZLEME;
});

describe("sitemap", () => {
  it("taslak önizlemesi açıkken bile yalnızca yayındaki dersleri listeler", () => {
    process.env.ICERIK_TASLAK_ONIZLEME = "1";

    const sitemapLessonSlugs = sitemap()
      .map((entry) => new URL(entry.url).pathname)
      .filter((pathname) => pathname.startsWith("/ders/"))
      .map((pathname) => pathname.slice("/ders/".length))
      .sort();
    const publishedSlugs = getAllLessons()
      .filter((lesson) => lesson.frontmatter.durum === "yayinda")
      .map((lesson) => lesson.slug)
      .sort();

    expect(sitemapLessonSlugs).toEqual(publishedSlugs);
    expect(publishedSlugs.length).toBeGreaterThan(0);
    expect(publishedSlugs.length).toBeLessThan(getAllLessons().length);
  });
});
