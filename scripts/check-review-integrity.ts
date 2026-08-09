import { getAllLessons, type Lesson } from "../lib/content";
import { computeLessonSubjectHashes } from "../lib/lessonArtifact";
import {
  getLessonReviewStatus,
  getRequiredReviewScopes,
  REVIEW_DECISIONS,
  REVIEW_SCOPES,
  REVIEWER_ROLES,
  reviewReceipts,
  SCOPE_SUBJECT_KEYS,
  type ReviewReceipt,
} from "../lib/reviewReceipts";
import { getOpenReviewDebtIds } from "../lib/reviewDebt";
import { isGitAvailable, objectExists, readFileAtCommit, readLessonAtCommit, resolveCommit } from "./git-lesson";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const APPEND_ONLY_BASE = process.env.REVIEW_APPEND_ONLY_BASE ?? "origin/main";

const lessons = getAllLessons();
const lessonsById = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
const debtIds = new Set(getOpenReviewDebtIds());
const errors: string[] = [];
const notes: string[] = [];
const gitReady = isGitAvailable();

if (
  reviewReceipts.schemaVersion !== 2 ||
  reviewReceipts.hashAlgorithm !== "sha256" ||
  reviewReceipts.canonicalization !== "lesson-artifact-v2"
) {
  errors.push("review-receipts.json Review Receipt v2 şemasıyla uyuşmuyor.");
}

const receiptIds = new Set<string>();
for (const receipt of reviewReceipts.receipts) {
  validateReceipt(receipt);
}

checkAppendOnly();

for (const lesson of lessons.filter((candidate) => candidate.frontmatter.durum === "yayinda")) {
  const status = getLessonReviewStatus(lesson);
  const inDebt = debtIds.has(lesson.slug);

  if (inDebt && status.state === "verified") {
    errors.push(`${lesson.slug}: güncel makbuz var; legacy review borcu kaydı kaldırılmalı.`);
  }
  if (!inDebt && status.state !== "verified") {
    const pending = status.scopeStatuses
      .filter((scope) => scope.state !== "verified")
      .map((scope) => `${scope.scope}:${scope.state}`)
      .join(", ");
    errors.push(`${lesson.slug}: yeni yayın için gerekli her kapsamda güncel Review Receipt zorunlu (${pending}).`);
  }
  if (!inDebt && lesson.frontmatter.kaynaklar.some((source) => typeof source === "string")) {
    errors.push(`${lesson.slug}: yeni yayınlarda kaynaklar yapılandırılmış SourceRef olmalı; legacy metin kaynak kabul edilmez.`);
  }
}

if (errors.length > 0) {
  console.error(`Review/yayın bütünlüğü ${errors.length} hata üretti:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
  process.exit(1);
}

for (const note of notes) console.log(`  not: ${note}`);
console.log(
  `Review/yayın bütünlüğü temiz: ${reviewReceipts.receipts.length} kapsam makbuzu, ` +
    `${debtIds.size} açık legacy borç; yeni yayınlar makbuzsuz geçemez.`,
);

function validateReceipt(receipt: ReviewReceipt): void {
  const label = receipt.id || "(boş id)";
  if (!receipt.id || receiptIds.has(receipt.id)) errors.push(`Makbuz id geçersiz veya yineleniyor: ${label}`);
  receiptIds.add(receipt.id);

  const lesson = lessonsById.get(receipt.lessonId);
  if (!lesson) {
    errors.push(`${label}: bilinmeyen lessonId ${receipt.lessonId}.`);
    return;
  }
  if (!REVIEW_SCOPES.includes(receipt.scope)) {
    errors.push(`${label}: geçersiz scope ${receipt.scope}.`);
    return;
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

  verifySourceCommit(receipt, lesson, label);
}

/**
 * `sourceCommit` gerçekten bu makbuzun bağlandığı hash'leri üreten commit mi?
 *
 * Yalnız biçim kontrolü, uydurma bir SHA'yı kabul eder. Commit nesnesi elde
 * varsa dersi o commit'ten okuyup kökleri yeniden hesaplıyoruz.
 */
function verifySourceCommit(receipt: ReviewReceipt, lesson: Lesson, label: string): void {
  if (!gitReady) {
    notes.push(`${label}: git yok, sourceCommit doğrulanamadı.`);
    return;
  }
  if (!objectExists(receipt.sourceCommit)) {
    notes.push(`${label}: sourceCommit bu klonda bulunamadı (sığ klon olabilir), içerik doğrulaması atlandı.`);
    return;
  }
  const historical = readLessonAtCommit(receipt.sourceCommit, lesson.filePath);
  if (!historical) {
    errors.push(`${label}: sourceCommit ${receipt.sourceCommit.slice(0, 8)} içinde ${lesson.slug} dosyası yok.`);
    return;
  }
  const hashes = computeLessonSubjectHashes(historical);
  for (const key of SCOPE_SUBJECT_KEYS[receipt.scope]) {
    if (receipt.subject?.[key] !== hashes[key]) {
      errors.push(`${label}: subject.${key}, sourceCommit'teki ders sürümüyle eşleşmiyor.`);
    }
  }
}

/**
 * Makbuz dosyası append-only'dir: var olan bir kayıt sessizce değiştirilemez
 * veya silinemez. Düzeltme, yeni bir makbuz yazılarak yapılır.
 */
function checkAppendOnly(): void {
  if (!gitReady || !resolveCommit(APPEND_ONLY_BASE)) {
    notes.push(`append-only kontrolü atlandı (${APPEND_ONLY_BASE} bulunamadı).`);
    return;
  }
  const previous = readReceiptsAtBase();
  if (!previous) return;
  const current = new Map(reviewReceipts.receipts.map((receipt) => [receipt.id, JSON.stringify(receipt)]));
  for (const receipt of previous) {
    const now = current.get(receipt.id);
    if (now === undefined) errors.push(`${receipt.id}: var olan makbuz silinmiş; makbuz dosyası append-only.`);
    else if (now !== JSON.stringify(receipt)) errors.push(`${receipt.id}: var olan makbuz değiştirilmiş; düzeltme yeni makbuzla yapılır.`);
  }
}

function readReceiptsAtBase(): ReviewReceipt[] | undefined {
  const raw = readFileAtCommit(APPEND_ONLY_BASE, "content/review-receipts.json");
  if (!raw) {
    notes.push("append-only kontrolü atlandı (base sürümde makbuz dosyası yok).");
    return undefined;
  }
  try {
    return (JSON.parse(raw) as { receipts?: ReviewReceipt[] }).receipts ?? [];
  } catch {
    notes.push("append-only kontrolü atlandı (base sürüm ayrıştırılamadı).");
    return undefined;
  }
}
