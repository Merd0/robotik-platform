import { describe, expect, it } from "vitest";
import { getAllLessons } from "./content";
import { computeLessonSubjectHashes } from "./lessonArtifact";
import { reviewDebt, reviewDebtBaseline, getOpenReviewDebtIds } from "./reviewDebt";
import {
  getLessonReviewStatus,
  getRequiredReviewScopes,
  reviewReceipts,
  SCOPE_SUBJECT_KEYS,
} from "./reviewReceipts";

describe("Review Receipt v2", () => {
  it("insan doğrulaması yokken makbuz uydurmaz", () => {
    expect(reviewReceipts.receipts).toEqual([]);
    const lesson = getAllLessons().find((candidate) => candidate.slug === "b-universite-jacobian");
    expect(lesson).toBeDefined();
    const status = getLessonReviewStatus(lesson!);
    expect(status.state).toBe("stale-after-content-change");
    expect(status.verifiedScopes).toEqual([]);
    expect(status.scopeStatuses.every((scope) => scope.state === "missing")).toBe(true);
  });

  it("güvenlik hattına ayrı safety review kapsamı zorunlu tutar", () => {
    const safetyLesson = getAllLessons().find((lesson) => lesson.frontmatter.hat === "h-guvenlik");
    const regularLesson = getAllLessons().find((lesson) => lesson.frontmatter.hat === "a-temeller");
    expect(getRequiredReviewScopes(safetyLesson!)).toContain("safety");
    expect(getRequiredReviewScopes(regularLesson!)).not.toContain("safety");
  });

  it("her kapsam yalnız bağlı olduğu köke bakar", () => {
    expect(SCOPE_SUBJECT_KEYS.source).toEqual(["sourceHash"]);
    expect(SCOPE_SUBJECT_KEYS.pedagogical).toEqual(["teachingHash"]);
    expect(SCOPE_SUBJECT_KEYS.technical).toContain("sourceHash");
    expect(SCOPE_SUBJECT_KEYS.technical).toContain("teachingHash");
    // presentationHash hiçbir kapsamda olmamalı: yayına almak insan
    // incelemesini geçersiz kılmaz.
    for (const keys of Object.values(SCOPE_SUBJECT_KEYS)) {
      expect(keys).not.toContain("presentationHash");
    }
  });

  it("makbuz kökleri gerçekten hesaplanan köklerle aynı biçimde", () => {
    const lesson = getAllLessons()[0];
    const hashes = computeLessonSubjectHashes(lesson);
    expect(hashes.sourceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(hashes.teachingHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

describe("review borcu baseline'ı", () => {
  it("güncel borç dondurulmuş baseline'ın alt kümesidir", () => {
    const acik = getOpenReviewDebtIds();
    expect(acik.length).toBeGreaterThan(0);
    for (const id of acik) expect(reviewDebtBaseline.has(id)).toBe(true);
  });

  it("baseline 39 derslik dondurulmuş küme", () => {
    expect(reviewDebt.baselineIds).toHaveLength(39);
    expect(reviewDebt.schemaVersion).toBe(2);
  });

  it("bir ders iki borç listesinde birden bulunmaz", () => {
    const kesisim = reviewDebt.staleAfterContentChange.filter((id) => reviewDebt.legacyUnverified.includes(id));
    expect(kesisim).toEqual([]);
  });
});
