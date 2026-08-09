import { describe, expect, it } from "vitest";
import { getAllLessons } from "./content";
import { getLessonReviewStatus, getRequiredReviewScopes, reviewReceipts } from "./reviewReceipts";

describe("Review Receipt v1", () => {
  it("insan doğrulaması yokken makbuz uydurmaz", () => {
    expect(reviewReceipts.receipts).toEqual([]);
    const lesson = getAllLessons().find((candidate) => candidate.slug === "b-universite-jacobian");
    expect(lesson).toBeDefined();
    const status = getLessonReviewStatus(lesson!);
    expect(status.state).toBe("stale-after-content-change");
    expect(status.verifiedScopes).toEqual([]);
  });

  it("güvenlik hattına ayrı safety review kapsamı zorunlu tutar", () => {
    const safetyLesson = getAllLessons().find((lesson) => lesson.frontmatter.hat === "h-guvenlik");
    const regularLesson = getAllLessons().find((lesson) => lesson.frontmatter.hat === "a-temeller");
    expect(getRequiredReviewScopes(safetyLesson!)).toContain("safety");
    expect(getRequiredReviewScopes(regularLesson!)).not.toContain("safety");
  });
});
