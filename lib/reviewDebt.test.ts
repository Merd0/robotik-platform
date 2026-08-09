import { describe, expect, it } from "vitest";
import { getAllLessons } from "./content";
import { getOpenReviewDebtIds, getReviewDebtStatus, reviewDebt } from "./reviewDebt";
import { getLessonReviewStatus } from "./reviewReceipts";

describe("review borcu kaydı", () => {
  it("her yayın ya açık borçtadır ya güncel makbuzludur — ikisi birden değil", () => {
    // v1'de bu test "borç kaydı = yayın kümesi" diyordu. O kural borcun
    // azalmasını imkânsız kılıyordu: ilk ders onaylanıp borçtan düştüğü anda
    // test kırılıyordu. v2'nin gerçek değişmezi bir bölünme (partition):
    // yayın kümesi, açık borç ile doğrulanmış kümenin ayrık birleşimidir.
    const published = getAllLessons().filter((lesson) => lesson.frontmatter.durum === "yayinda");
    const openDebt = new Set(getOpenReviewDebtIds());

    expect(openDebt.size).toBe(reviewDebt.staleAfterContentChange.length + reviewDebt.legacyUnverified.length);

    for (const lesson of published) {
      const verified = getLessonReviewStatus(lesson).state === "verified";
      expect(verified || openDebt.has(lesson.slug), `${lesson.slug} ne borçta ne doğrulanmış`).toBe(true);
      expect(verified && openDebt.has(lesson.slug), `${lesson.slug} hem borçta hem doğrulanmış`).toBe(false);
    }

    // Borç kaydı yalnız yayınları izler; taslak borç listesine giremez.
    const publishedIds = new Set(published.map((lesson) => lesson.slug));
    for (const id of openDebt) expect(publishedIds.has(id), `${id} yayında değil ama borçta`).toBe(true);
  });

  it("değişiklik sonrası eskiyen kayıtları ayrı gösterir", () => {
    expect(getReviewDebtStatus("b-universite-jacobian").state).toBe("stale-after-content-change");
    expect(getReviewDebtStatus("a-lise-calisma-uzayi").state).toBe("legacy-unverified");
    expect(getReviewDebtStatus("bilinmeyen-ders").state).toBe("untracked");
  });
});
