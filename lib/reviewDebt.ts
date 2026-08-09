import reviewDebtData from "@/content/review-debt.json";

export type ReviewDebtState = "stale-after-content-change" | "legacy-unverified" | "untracked";

export interface ReviewDebtStatus {
  state: ReviewDebtState;
  label: string;
  explanation: string;
}

/**
 * Legacy review borcu.
 *
 * `baselineIds` 2026-08-09'da dondurulmuş 39 derslik kümedir ve değişmez;
 * `scripts/check-review-debt.ts` içindeki tek sabit onu çıpalar. Güncel borç
 * (`staleAfterContentChange` + `legacyUnverified`) bu kümenin alt kümesi
 * olmak zorundadır ve yalnız küçülebilir.
 *
 * Bu ayrım bilinçli: v1'de sabit, GÜNCEL kümenin parmak izini donduruyordu.
 * Doğru güvenlik özelliğini (yeni ders sessizce borca eklenemez) sağlıyordu
 * ama borcun azalmasını da engelliyordu — bir dersi onaylamak governance
 * script'ini düzenlemeyi gerektiriyordu, yani 39 kez elle onay. Baseline'ı
 * veriye taşımak aynı güvenceyi korur, ritüeli kaldırır.
 */
export const reviewDebt = reviewDebtData;

const staleLessons = new Set<string>(reviewDebt.staleAfterContentChange);
const legacyLessons = new Set<string>(reviewDebt.legacyUnverified);
export const reviewDebtBaseline = new Set<string>(reviewDebt.baselineIds);

export function getOpenReviewDebtIds(): string[] {
  return [...staleLessons, ...legacyLessons];
}

export function getReviewDebtStatus(lessonId: string): ReviewDebtStatus {
  if (staleLessons.has(lessonId)) {
    return {
      state: "stale-after-content-change",
      label: "Yeniden insan incelemesi gerekli",
      explanation: "Ders metni son kayıtlı inceleme tarihinden sonra değişti. Bu sürüm için yeni bir insan onayı doğrulanamadı.",
    };
  }

  if (legacyLessons.has(lessonId)) {
    return {
      state: "legacy-unverified",
      label: "Sürüme bağlı inceleme kaydı gerekli",
      explanation: "Kayıtlı kişi ve tarih var; ancak bu ders sürümüne bağlı doğrulanabilir bir inceleme makbuzu henüz yok.",
    };
  }

  return {
    state: "untracked",
    label: "İnceleme durumu doğrulanamadı",
    explanation: "Bu ders review borcu kaydında bulunmuyor. Yayın kararı verilmeden önce kayıt bütünlüğü kontrol edilmeli.",
  };
}
