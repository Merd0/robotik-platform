import { describe, expect, it } from "vitest";
import { getAllLessons } from "./content";
import { getOpenReviewDebtIds, getReviewDebtStatus, reviewDebt } from "./reviewDebt";
import { getLessonReviewStatus } from "./reviewReceipts";

describe("review borcu kaydı", () => {
  it("borç kaydı tutarlı: yayınları izler, makbuzla çakışmaz, baseline'ı aşmaz", () => {
    // Bu testin iddiası politika değiştikçe iki kez daraldı ve bu bilinçli:
    //
    //  v1: "borç kaydı = yayın kümesi" — ilk ders onaylanıp borçtan düştüğü
    //      anda kırılıyordu.
    //  v2: "yayın = açık borç ⊎ doğrulanmış" (ayrık bölünme).
    //  2026-08-10: insan incelemesi opsiyonel oldu; bir yayının ne borçta ne
    //      makbuzlu olması ARTIK NORMAL. Bölünme iddiası düştü.
    //
    // Geriye kalan ve hâlâ anlamlı olan üç değişmez aşağıda.
    const published = getAllLessons().filter((lesson) => lesson.frontmatter.durum === "yayinda");
    const publishedIds = new Set(published.map((lesson) => lesson.slug));
    const openDebt = new Set(getOpenReviewDebtIds());

    expect(openDebt.size).toBe(reviewDebt.staleAfterContentChange.length + reviewDebt.legacyUnverified.length);

    // 1. Borç kaydı yalnız yayınları izler.
    for (const id of openDebt) expect(publishedIds.has(id), `${id} yayında değil ama borçta`).toBe(true);

    // 2. Bir ders hem borçta hem güncel makbuzlu olamaz — makbuz yazıldığında
    //    borç kaydı düşer (npm run review onayla bunu kendisi yapar).
    for (const lesson of published) {
      const verified = getLessonReviewStatus(lesson).state === "verified";
      expect(verified && openDebt.has(lesson.slug), `${lesson.slug} hem borçta hem doğrulanmış`).toBe(false);
    }

    // 3. Borç yalnız küçülebilir: dondurulmuş baseline'ın alt kümesidir.
    const baseline = new Set(reviewDebt.baselineIds);
    for (const id of openDebt) expect(baseline.has(id), `${id} baseline dışında`).toBe(true);
  });

  it("değişiklik sonrası eskiyen kayıtları ayrı gösterir", () => {
    expect(getReviewDebtStatus("b-universite-jacobian").state).toBe("stale-after-content-change");
    expect(getReviewDebtStatus("a-lise-calisma-uzayi").state).toBe("legacy-unverified");
    expect(getReviewDebtStatus("bilinmeyen-ders").state).toBe("untracked");
  });
});
