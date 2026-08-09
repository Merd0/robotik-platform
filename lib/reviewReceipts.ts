import reviewReceiptsData from "@/content/review-receipts.json";
import type { Lesson } from "./content";
import { computeLessonSubjectHashes, type LessonSubjectHashes } from "./lessonArtifact";
import { getReviewDebtStatus, type ReviewDebtState } from "./reviewDebt";

export const REVIEW_SCOPES = ["source", "technical", "pedagogical", "safety"] as const;
export type ReviewScope = (typeof REVIEW_SCOPES)[number];

export const REVIEWER_ROLES = ["maintainer", "robotics-sme", "educator", "safety-sme"] as const;
export type ReviewerRole = (typeof REVIEWER_ROLES)[number];

export const REVIEW_DECISIONS = ["approved", "changes-requested"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

/** Bir inceleme kapsamının bağlı olduğu ders kökleri. */
export type ReviewSubjectKey = "sourceHash" | "teachingHash";

/**
 * Hangi kapsam hangi köke bakar.
 *
 * - `source`: yalnız kaynak listesi. Ders metni değişmesi kaynak
 *   incelemesini eskitmez.
 * - `technical`: iddialar hem metinden hem dayandığı kaynaktan gelir.
 * - `pedagogical`: yalnız öğretim metni ve kazanımlar.
 * - `safety`: güvenlik iddiası da metne ve kaynağa birlikte dayanır.
 *
 * `presentationHash` bilinçli olarak hiçbir kapsamda yok: dersi yayına almak,
 * süresini düzeltmek veya sıralamasını değiştirmek insan incelemesini
 * geçersiz kılmaz.
 */
export const SCOPE_SUBJECT_KEYS: Record<ReviewScope, readonly ReviewSubjectKey[]> = {
  source: ["sourceHash"],
  technical: ["sourceHash", "teachingHash"],
  pedagogical: ["teachingHash"],
  safety: ["sourceHash", "teachingHash"],
};

export interface ReviewReceipt {
  id: string;
  lessonId: string;
  /** Tek makbuz = tek kapsam = tek insan kararı. */
  scope: ReviewScope;
  decision: ReviewDecision;
  /** Yalnız bu kapsamın bağlı olduğu kökler yazılır. */
  subject: Partial<Record<ReviewSubjectKey, string>>;
  sourceCommit: string;
  reviewedAt: string;
  reviewer: { displayName: string; role: ReviewerRole };
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

const SUBJECT_LABELS: Record<ReviewSubjectKey, string> = {
  sourceHash: "kaynak listesi",
  teachingHash: "ders metni",
};

export function getRequiredReviewScopes(lesson: Pick<Lesson, "frontmatter">): ReviewScope[] {
  const scopes: ReviewScope[] = ["source", "technical", "pedagogical"];
  if (lesson.frontmatter.hat === "h-guvenlik") scopes.push("safety");
  return scopes;
}

export type ReviewScopeState = "verified" | "changes-requested" | "stale" | "missing";

export interface ReviewScopeStatus {
  scope: ReviewScope;
  state: ReviewScopeState;
  receipt?: ReviewReceipt;
  /** Hangi kökler makbuzdan sonra değişti. */
  changedSubjects: ReviewSubjectKey[];
  label: string;
}

export type LessonReviewState = "verified" | "changes-requested" | "receipt-stale" | ReviewDebtState;

export interface LessonReviewStatus {
  state: LessonReviewState;
  hashes: LessonSubjectHashes;
  requiredScopes: ReviewScope[];
  verifiedScopes: ReviewScope[];
  scopeStatuses: ReviewScopeStatus[];
  latestReceipt?: ReviewReceipt;
  label: string;
  explanation: string;
}

const SCOPE_STATE_LABELS: Record<ReviewScopeState, string> = {
  verified: "doğrulandı",
  "changes-requested": "değişiklik istendi",
  stale: "yenilenmeli",
  missing: "bekliyor",
};

/** Dosya append-only tutulur; bir kapsamın son sözü listedeki son kaydıdır. */
function findLatestReceipt(lessonId: string, scope: ReviewScope): ReviewReceipt | undefined {
  return reviewReceipts.receipts.filter((receipt) => receipt.lessonId === lessonId && receipt.scope === scope).at(-1);
}

function evaluateScope(lessonId: string, scope: ReviewScope, hashes: LessonSubjectHashes): ReviewScopeStatus {
  const receipt = findLatestReceipt(lessonId, scope);
  if (!receipt) {
    return { scope, state: "missing", changedSubjects: [], label: SCOPE_STATE_LABELS.missing };
  }

  const changedSubjects = SCOPE_SUBJECT_KEYS[scope].filter((key) => receipt.subject[key] !== hashes[key]);
  if (changedSubjects.length > 0) {
    return { scope, state: "stale", receipt, changedSubjects, label: SCOPE_STATE_LABELS.stale };
  }

  const state: ReviewScopeState = receipt.decision === "approved" ? "verified" : "changes-requested";
  return { scope, state, receipt, changedSubjects: [], label: SCOPE_STATE_LABELS[state] };
}

function describeStale(scopeStatuses: ReviewScopeStatus[]): string {
  const changed = new Set(scopeStatuses.flatMap((status) => status.changedSubjects));
  const changedLabels = [...changed].map((key) => SUBJECT_LABELS[key]);
  const staleScopes = scopeStatuses
    .filter((status) => status.state === "stale")
    .map((status) => REVIEW_SCOPE_LABELS[status.scope].toLocaleLowerCase("tr"));
  if (changedLabels.length === 0) return "Bu sürüm için yeniden inceleme gerekiyor.";
  return `${changedLabels.join(" ve ")} son incelemeden sonra değişti; ${staleScopes.join(", ")} incelemesi yenilenmeli.`;
}

export function getLessonReviewStatus(lesson: Lesson): LessonReviewStatus {
  const hashes = computeLessonSubjectHashes(lesson);
  const requiredScopes = getRequiredReviewScopes(lesson);
  const scopeStatuses = requiredScopes.map((scope) => evaluateScope(lesson.slug, scope, hashes));
  const verifiedScopes = scopeStatuses.filter((status) => status.state === "verified").map((status) => status.scope);
  const latestReceipt = scopeStatuses.map((status) => status.receipt).filter(Boolean).at(-1);
  const base = { hashes, requiredScopes, verifiedScopes, scopeStatuses, latestReceipt };

  if (scopeStatuses.every((status) => status.state === "verified")) {
    return {
      ...base,
      state: "verified",
      label: "Bu sürüme bağlı insan incelemesi var",
      explanation: "Gerekli her inceleme kapsamı, öğrencinin gördüğü bu ders sürümüne bağlı bir makbuza dayanıyor.",
    };
  }

  if (scopeStatuses.some((status) => status.state === "changes-requested")) {
    return {
      ...base,
      state: "changes-requested",
      label: "İncelemede değişiklik istendi",
      explanation: "Bir inceleme kapsamı bu sürüm için onay vermedi. Düzeltme yapılmadan doğrulanmış sayılmaz.",
    };
  }

  if (scopeStatuses.some((status) => status.state === "stale")) {
    return {
      ...base,
      state: "receipt-stale",
      label: "İçerik değişti; inceleme yenilenmeli",
      explanation: describeStale(scopeStatuses),
    };
  }

  const debt = getReviewDebtStatus(lesson.slug);
  if (verifiedScopes.length > 0) {
    const pending = scopeStatuses
      .filter((status) => status.state === "missing")
      .map((status) => REVIEW_SCOPE_LABELS[status.scope].toLocaleLowerCase("tr"));
    return {
      ...base,
      state: debt.state,
      label: "İnceleme sürüyor",
      explanation: `Bu sürüm için ${verifiedScopes.length}/${requiredScopes.length} kapsam onaylandı; ${pending.join(", ")} incelemesi bekliyor.`,
    };
  }
  return { ...base, state: debt.state, label: debt.label, explanation: debt.explanation };
}
