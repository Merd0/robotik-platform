import reviewDebtData from "@/content/review-debt.json";

export type ReviewDebtState = "stale-after-content-change" | "legacy-unverified" | "untracked";

export interface ReviewDebtStatus {
  state: ReviewDebtState;
  label: string;
  explanation: string;
}

export const reviewDebt = reviewDebtData;

const staleLessons = new Set<string>(reviewDebt.staleAfterContentChange);
const legacyLessons = new Set<string>(reviewDebt.legacyUnverified);

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
