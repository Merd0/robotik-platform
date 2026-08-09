import { afterEach, describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";
import { getAllLessons, getPublishedLessons } from "./content";
import { getFileLastModified } from "./fileModified";
import { getSozluk, terimSlug } from "./sozluk";

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

  it("72 tekil sözlük URL'sini listeler", () => {
    const termPaths = sitemap()
      .map((entry) => new URL(entry.url).pathname)
      .filter((pathname) => pathname.startsWith("/sozluk/"))
      .sort();
    const expected = getSozluk().map((terim) => `/sozluk/${terimSlug(terim.tr)}`).sort();

    expect(termPaths).toEqual(expected);
    expect(termPaths).toHaveLength(72);
  });

  it("ders tazeliğini legacy inceleme tarihinden değil dosyanın Git değişiklik tarihinden alır", () => {
    const lesson = getPublishedLessons()[0];
    const entry = sitemap().find((item) => item.url.endsWith(`/ders/${lesson.slug}`));

    expect(entry?.lastModified).toEqual(getFileLastModified(lesson.filePath));
    expect(entry?.lastModified).toBeInstanceOf(Date);
    expect(entry?.lastModified).not.toBe(lesson.frontmatter.incelendi_tarih);
  });
});
