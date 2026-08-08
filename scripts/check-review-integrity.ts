import { getAllLessons } from "../lib/content";
import { computeLessonArtifactHash } from "../lib/lessonArtifact";
import {
  getRequiredReviewScopes,
  REVIEW_SCOPES,
  reviewReceipts,
  type ReviewReceipt,
} from "../lib/reviewReceipts";
import { reviewDebt } from "../lib/reviewDebt";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const lessons = getAllLessons();
const lessonsById = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
const debtIds = new Set([...reviewDebt.staleAfterContentChange, ...reviewDebt.legacyUnverified]);
const errors: string[] = [];

if (reviewReceipts.schemaVersion !== 1 || reviewReceipts.hashAlgorithm !== "sha256" || reviewReceipts.canonicalization !== "lesson-artifact-v1") {
  errors.push("review-receipts.json Review Receipt v1 şemasıyla uyuşmuyor.");
}

const receiptIds = new Set<string>();
for (const receipt of reviewReceipts.receipts) {
  validateReceipt(receipt);
}

for (const lesson of lessons.filter((candidate) => candidate.frontmatter.durum === "yayinda")) {
  const artifactHash = computeLessonArtifactHash(lesson);
  const currentReceipt = reviewReceipts.receipts.find(
    (receipt) => receipt.lessonId === lesson.slug && receipt.artifactHash === artifactHash,
  );

  if (debtIds.has(lesson.slug) && currentReceipt) {
    errors.push(`${lesson.slug}: güncel makbuz var; legacy review borcu kaydı kaldırılmalı.`);
  }
  if (!debtIds.has(lesson.slug) && !currentReceipt) {
    errors.push(`${lesson.slug}: yeni yayın için güncel, sürüme bağlı Review Receipt zorunlu.`);
  }
  if (!debtIds.has(lesson.slug) && lesson.frontmatter.kaynaklar.some((source) => typeof source === "string")) {
    errors.push(`${lesson.slug}: yeni yayınlarda kaynaklar yapılandırılmış SourceRef olmalı; legacy metin kaynak kabul edilmez.`);
  }
}

if (errors.length > 0) {
  console.error(`Review/yayın bütünlüğü ${errors.length} hata üretti:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Review/yayın bütünlüğü temiz: ${reviewReceipts.receipts.length} makbuz, ` +
    `${debtIds.size} açık legacy borç; yeni yayınlar makbuzsuz geçemez.`,
);

function validateReceipt(receipt: ReviewReceipt): void {
  if (!receipt.id || receiptIds.has(receipt.id)) errors.push(`Makbuz id geçersiz veya yineleniyor: ${receipt.id || "(boş)"}`);
  receiptIds.add(receipt.id);
  const lesson = lessonsById.get(receipt.lessonId);
  if (!lesson) errors.push(`${receipt.id}: bilinmeyen lessonId ${receipt.lessonId}.`);
  if (!HASH_PATTERN.test(receipt.artifactHash)) errors.push(`${receipt.id}: artifactHash sha256 biçiminde değil.`);
  if (!COMMIT_PATTERN.test(receipt.sourceCommit)) errors.push(`${receipt.id}: sourceCommit tam 40 karakter Git SHA olmalı.`);
  if (!DATE_PATTERN.test(receipt.reviewedAt)) errors.push(`${receipt.id}: reviewedAt YYYY-MM-DD olmalı.`);
  if (!receipt.reviewer?.displayName?.trim() || !receipt.reviewer?.role) errors.push(`${receipt.id}: reviewer adı ve rolü zorunlu.`);
  if (new Set(receipt.scopes).size !== receipt.scopes.length || receipt.scopes.some((scope) => !REVIEW_SCOPES.includes(scope))) {
    errors.push(`${receipt.id}: scopes geçersiz veya yineleniyor.`);
  }
  if (lesson) {
    const missingScopes = getRequiredReviewScopes(lesson).filter((scope) => !receipt.scopes.includes(scope));
    if (missingScopes.length) errors.push(`${receipt.id}: zorunlu review kapsamları eksik: ${missingScopes.join(", ")}.`);
  }
}
