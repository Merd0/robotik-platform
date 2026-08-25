import { afterEach, describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";
import { getAllLessons, getPublishedLessons } from "./content";
import { getFileLastModified } from "./fileModified";
import { KOD_AKADEMISI_ASAMALAR, getPublicModules } from "./kodAkademisi";
import { getSozluk, terimSlug } from "./sozluk";
import { NOINDEX_STATIC_ROUTES, getIndexableStaticPageRoutes } from "./staticRoutes";

const ORIJINAL_ONIZLEME = process.env.ICERIK_TASLAK_ONIZLEME;

afterEach(() => {
  if (ORIJINAL_ONIZLEME === undefined) delete process.env.ICERIK_TASLAK_ONIZLEME;
  else process.env.ICERIK_TASLAK_ONIZLEME = ORIJINAL_ONIZLEME;
});

describe("sitemap", () => {
  it("öğretmen pilotu ve oyun alanı gibi statik kaynakları listeler", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(paths).toContain("/ogretmen");
    expect(paths).toContain("/oyun-alani");
    expect(paths).toContain("/laboratuvar");
    expect(paths).toContain("/laboratuvar/ariza-klinigi");
    expect(paths).toContain("/laboratuvar/dil-karsilastirici");
    expect(paths).toContain("/laboratuvar/ters-problem");
    expect(paths).toContain("/laboratuvar/dijital-ikiz-kaymasi");
    expect(paths).toContain("/laboratuvar/hata-muzesi");
    expect(paths).toContain("/bilgi-haritasi");
  });

  it("bütün indekslenebilir statik sayfaları otomatik kapsar", () => {
    const entries = sitemap();
    const paths = entries.map((entry) => new URL(entry.url).pathname);

    expect(paths).toEqual(expect.arrayContaining(getIndexableStaticPageRoutes()));
    for (const noindexRoute of NOINDEX_STATIC_ROUTES) {
      expect(paths).not.toContain(noindexRoute);
    }
    expect(entries.find((entry) => new URL(entry.url).pathname === "/laboratuvar")?.lastModified).toBeInstanceOf(Date);
  });

  it("yayındaki Kod Akademisi aşama ve modül rotalarını listeler", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    const publishedModules = getPublicModules().filter((academyModule) => academyModule.frontmatter.durum === "yayinda");

    for (const stage of KOD_AKADEMISI_ASAMALAR) {
      if (publishedModules.some((academyModule) => academyModule.frontmatter.asama === stage)) {
        expect(paths).toContain(`/kod-akademisi/${stage}`);
      }
    }
    for (const academyModule of publishedModules) {
      expect(paths).toContain(`/kod-akademisi/${academyModule.frontmatter.asama}/${academyModule.slug}`);
    }
  });

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

    // Korpus şu an taslak içermeyebilir (2026-08-10'da hepsi yayına alındı),
    // bu yüzden "yayın sayısı < toplam" artık bir değişmez değil. Korunması
    // gereken kural taslak sayısından bağımsız: önizleme açıkken bile taslak
    // bir ders sitemap'e giremez.
    const taslakSluglar = getAllLessons()
      .filter((lesson) => lesson.frontmatter.durum !== "yayinda")
      .map((lesson) => lesson.slug);
    expect(sitemapLessonSlugs.filter((slug) => taslakSluglar.includes(slug))).toEqual([]);
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
