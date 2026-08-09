import { describe, expect, it } from "vitest";
import { getPublishedLessons } from "./content";
import { lessonJsonLd, lessonUrl } from "./seo";

describe("ders yapılandırılmış verisi", () => {
  it("frontmatter'daki eğitim alanlarını LearningResource/Course JSON-LD'ye taşır", () => {
    const lesson = getPublishedLessons()[0];
    const jsonLd = lessonJsonLd(lesson, lesson.frontmatter.onkosul);

    expect(jsonLd["@type"]).toEqual(["Course", "LearningResource"]);
    expect(jsonLd.url).toBe(lessonUrl(lesson.slug));
    expect(jsonLd.name).toBe(lesson.frontmatter.baslik);
    expect(jsonLd.timeRequired).toBe(`PT${lesson.frontmatter.sure}M`);
    expect(jsonLd.teaches).toEqual(lesson.frontmatter.kazanimlar);
    expect(jsonLd.inLanguage).toBe("tr");
  });
});
