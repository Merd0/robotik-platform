import { describe, expect, it } from "vitest";
import { getPublishedLessons, type Seviye } from "./content";
import { CURATED_START_ROUTES } from "./learningRoutes";

describe("elle seçilmiş başlangıç rotaları", () => {
  const publishedBySlug = new Map(getPublishedLessons().map((lesson) => [lesson.slug, lesson]));

  for (const [seviye, route] of Object.entries(CURATED_START_ROUTES) as [Seviye, readonly string[]][]) {
    it(`${seviye} için üç yayımlı ve ardışık ön koşullu ders taşır`, () => {
      expect(route).toHaveLength(3);
      expect(new Set(route).size).toBe(3);

      const lessons = route.map((slug) => publishedBySlug.get(slug));
      expect(lessons.every(Boolean)).toBe(true);
      expect(lessons.every((lesson) => lesson?.frontmatter.seviye === seviye)).toBe(true);

      for (let index = 1; index < lessons.length; index += 1) {
        expect(lessons[index]?.frontmatter.onkosul).toContain(lessons[index - 1]?.slug);
      }
    });
  }
});
