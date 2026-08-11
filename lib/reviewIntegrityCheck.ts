import type { LessonSubjectHashes } from "./lessonArtifact";
import { REVIEW_DECISIONS, REVIEW_SCOPES, REVIEWER_ROLES, SCOPE_SUBJECT_KEYS, type ReviewReceipt } from "./reviewReceipts";

export const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
export const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ReviewReceiptsDoc {
  schemaVersion: number;
  hashAlgorithm: string;
  canonicalization: string;
  receipts: readonly ReviewReceipt[];
}

/**
 * Sprint 0 "kanıt motoru" düzeltmesi: review kontrolü iki kanala ayrıldı
 * (bkz. scripts/check-review-integrity.ts ve scripts/check-review-debt.ts
 * başındaki notlar).
 *
 * Bu dosyadaki fonksiyonlar yalnız RECEIPT-INTEGRITY kanalına aittir — bir
 * makbuzun tahrif edilip edilmediğini (yanlış hash, bozuk şema, yetkisiz rol,
 * append-only ihlali) denetler. Hiçbiri dosya sistemine veya git'e dokunmaz;
 * bu yüzden doğrudan birim testiyle doğrulanabilir (lib/reviewIntegrityCheck.test.ts).
 * Git'e bağlı olan tek adım (sourceCommit'teki ders içeriğinden hash yeniden
 * hesaplama) çağıran script tarafında kalır; bu dosya yalnız KARŞILAŞTIRMAYI
 * yapar (bkz. verifyReceiptSubjectHashes).
 *
 * Kapsam dışı: eksik makbuz (bir dersin hiç incelenmemiş olması) burada asla
 * hata üretmez — çünkü bu fonksiyonlar yalnız VAR OLAN makbuzları denetler.
 * Eksik makbuzun raporlanması review-coverage kanalının (check-review-debt.ts)
 * işidir ve orada asla fatal değildir.
 */
export function checkReceiptsSchema(doc: Pick<ReviewReceiptsDoc, "schemaVersion" | "hashAlgorithm" | "canonicalization">): string[] {
  if (doc.schemaVersion !== 2 || doc.hashAlgorithm !== "sha256" || doc.canonicalization !== "lesson-artifact-v2") {
    return ["review-receipts.json Review Receipt v2 şemasıyla uyuşmuyor."];
  }
  return [];
}

/**
 * Bir makbuzun KENDİ İÇİNDE tutarlı olup olmadığını denetler: id tekilliği,
 * bilinen lessonId, geçerli scope/decision, sourceCommit ve reviewedAt
 * biçimi, reviewer adı/rolü, safety kapsamı kısıtı, subject hash biçimi ve
 * kapsam dışı subject anahtarı.
 */
export function validateReceiptShape(
  receipt: ReviewReceipt,
  knownLessonSlugs: ReadonlySet<string>,
  seenIds: Set<string>,
): string[] {
  const errors: string[] = [];
  const label = receipt.id || "(boş id)";
  if (!receipt.id || seenIds.has(receipt.id)) errors.push(`Makbuz id geçersiz veya yineleniyor: ${label}`);
  seenIds.add(receipt.id);

  if (!knownLessonSlugs.has(receipt.lessonId)) {
    errors.push(`${label}: bilinmeyen lessonId ${receipt.lessonId}.`);
    return errors;
  }
  if (!REVIEW_SCOPES.includes(receipt.scope)) {
    errors.push(`${label}: geçersiz scope ${receipt.scope}.`);
    return errors;
  }
  if (!REVIEW_DECISIONS.includes(receipt.decision)) errors.push(`${label}: decision approved veya changes-requested olmalı.`);
  if (!COMMIT_PATTERN.test(receipt.sourceCommit)) errors.push(`${label}: sourceCommit tam 40 karakter Git SHA olmalı.`);
  if (!DATE_PATTERN.test(receipt.reviewedAt) || Number.isNaN(Date.parse(receipt.reviewedAt))) {
    errors.push(`${label}: reviewedAt gerçek bir YYYY-MM-DD tarihi olmalı.`);
  }
  if (!receipt.reviewer?.displayName?.trim()) errors.push(`${label}: reviewer adı zorunlu.`);
  if (!REVIEWER_ROLES.includes(receipt.reviewer?.role)) errors.push(`${label}: reviewer rolü geçersiz.`);
  if (receipt.scope === "safety" && receipt.reviewer?.role !== "safety-sme") {
    errors.push(`${label}: safety kapsamı yalnız safety-sme rolündeki bir inceleyene bağlanabilir.`);
  }

  const requiredKeys = SCOPE_SUBJECT_KEYS[receipt.scope];
  const presentKeys = Object.keys(receipt.subject ?? {});
  for (const key of requiredKeys) {
    if (!HASH_PATTERN.test(receipt.subject?.[key] ?? "")) errors.push(`${label}: subject.${key} sha256 biçiminde değil.`);
  }
  for (const key of presentKeys) {
    if (!requiredKeys.includes(key as (typeof requiredKeys)[number])) {
      errors.push(`${label}: ${receipt.scope} kapsamı subject.${key} taşıyamaz.`);
    }
  }
  return errors;
}

/**
 * Makbuzdaki kök hash'lerin, dersin GERÇEKTEN o commit'teki sürümünden
 * hesaplanan köklerle eşleşip eşleşmediğini denetler. Uyuşmazlık, bir
 * makbuzun tahrif edildiğinin (ya da yanlış derse/sürüme bağlandığının)
 * doğrudan kanıtıdır — bu yüzden her zaman fatal'dır.
 */
export function verifyReceiptSubjectHashes(receipt: ReviewReceipt, computedHashes: LessonSubjectHashes): string[] {
  const label = receipt.id || "(boş id)";
  const errors: string[] = [];
  for (const key of SCOPE_SUBJECT_KEYS[receipt.scope]) {
    if (receipt.subject?.[key] !== computedHashes[key]) {
      errors.push(`${label}: subject.${key}, sourceCommit'teki ders sürümüyle eşleşmiyor.`);
    }
  }
  return errors;
}

/**
 * Makbuz dosyası append-only'dir: var olan bir kayıt sessizce değiştirilemez
 * veya silinemez. Düzeltme, yeni bir makbuz yazılarak yapılır.
 */
export function checkAppendOnlyReceipts(previous: readonly ReviewReceipt[], current: readonly ReviewReceipt[]): string[] {
  const errors: string[] = [];
  const currentById = new Map(current.map((receipt) => [receipt.id, JSON.stringify(receipt)]));
  for (const receipt of previous) {
    const now = currentById.get(receipt.id);
    if (now === undefined) errors.push(`${receipt.id}: var olan makbuz silinmiş; makbuz dosyası append-only.`);
    else if (now !== JSON.stringify(receipt)) errors.push(`${receipt.id}: var olan makbuz değiştirilmiş; düzeltme yeni makbuzla yapılır.`);
  }
  return errors;
}
