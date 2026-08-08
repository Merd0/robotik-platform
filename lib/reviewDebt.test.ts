import { describe, expect, it } from "vitest";
import { getAllLessons } from "./content";
import { getReviewDebtStatus, reviewDebt } from "./reviewDebt";

describe("review borcu kaydı", () => {
  it("mevcut bütün yayınları tam bir kez kapsar", () => {
    const publishedIds = getAllLessons()
      .filter((lesson) => lesson.frontmatter.durum === "yayinda")
      .map((lesson) => lesson.slug)
      .sort();
    const recordedIds = [
      ...reviewDebt.staleAfterContentChange,
      ...reviewDebt.legacyUnverified,
    ].sort();

    expect(new Set(recordedIds).size).toBe(recordedIds.length);
    expect(recordedIds).toEqual(publishedIds);
  });

  it("değişiklik sonrası eskiyen kayıtları ayrı gösterir", () => {
    expect(getReviewDebtStatus("b-universite-jacobian").state).toBe("stale-after-content-change");
    expect(getReviewDebtStatus("a-lise-calisma-uzayi").state).toBe("legacy-unverified");
    expect(getReviewDebtStatus("bilinmeyen-ders").state).toBe("untracked");
  });
});
