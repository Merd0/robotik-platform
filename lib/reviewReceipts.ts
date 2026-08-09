import reviewReceiptsData from "@/content/review-receipts.json";
import type { Lesson } from "./content";
import { computeLessonArtifactHash } from "./lessonArtifact";
import { getReviewDebtStatus, type ReviewDebtState } from "./reviewDebt";

export const REVIEW_SCOPES = ["source", "technical", "pedagogical", "safety"] as const;
export type ReviewScope = (typeof REVIEW_SCOPES)[number];

export interface ReviewReceipt {
  id: string;
  lessonId: string;
  artifactHash: string;
  sourceCommit: string;
  reviewedAt: string;
  reviewer: {
    displayName: string;
    role: "maintainer" | "robotics-sme" | "educator" | "safety-sme";
  };
  scopes: ReviewScope[];
  notes?: string;
}

export const reviewReceipts = reviewReceiptsData as {
  schemaVersion: number;
  hashAlgorithm: string;
  canonicalization: string;
  receipts: ReviewReceipt[];
};

export const REVIEW_SCOPE_LABELS: Record<ReviewScope, string> = {
  source: "Kaynak",
  technical: "Teknik doğruluk",
  pedagogical: "Pedagojik uygunluk",
  safety: "Güvenlik",
};

export function getRequiredReviewScopes(lesson: Pick<Lesson, "frontmatter">): ReviewScope[] {
  const scopes: ReviewScope[] = ["source", "technical", "pedagogical"];
  if (lesson.frontmatter.hat === "h-guvenlik") scopes.push("safety");
  return scopes;
}

export type LessonReviewState = "verified" | "receipt-stale" | ReviewDebtState;

export interface LessonReviewStatus {
  state: LessonReviewState;
  artifactHash: string;
  requiredScopes: ReviewScope[];
  verifiedScopes: ReviewScope[];
  receipt?: ReviewReceipt;
  label: string;
  explanation: string;
}

export function getLessonReviewStatus(lesson: Lesson): LessonReviewStatus {
  const artifactHash = computeLessonArtifactHash(lesson);
  const lessonReceipts = reviewReceipts.receipts.filter((receipt) => receipt.lessonId === lesson.slug);
  const currentReceipt = lessonReceipts.find((receipt) => receipt.artifactHash === artifactHash);
  const requiredScopes = getRequiredReviewScopes(lesson);

  if (currentReceipt) {
    return {
      state: "verified",
      artifactHash,
      requiredScopes,
      verifiedScopes: currentReceipt.scopes,
      receipt: currentReceipt,
      label: "Bu sürüme bağlı insan incelemesi var",
      explanation: "İnceleme makbuzundaki içerik hash'i, öğrencinin gördüğü ders artifact'ıyla eşleşiyor.",
    };
  }

  if (lessonReceipts.length > 0) {
    return {
      state: "receipt-stale",
      artifactHash,
      requiredScopes,
      verifiedScopes: [],
      receipt: lessonReceipts.at(-1),
      label: "İçerik değişti; inceleme makbuzu eskidi",
      explanation: "Kayıtlı makbuz başka bir ders artifact'ına ait. Güncel sürüm yeniden incelenmeden doğrulanmış sayılmaz.",
    };
  }

  const debt = getReviewDebtStatus(lesson.slug);
  return {
    ...debt,
    artifactHash,
    requiredScopes,
    verifiedScopes: [],
  };
}
