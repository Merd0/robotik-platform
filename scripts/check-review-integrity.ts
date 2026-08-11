import { getAllLessons } from "../lib/content";
import { computeLessonSubjectHashes } from "../lib/lessonArtifact";
import {
  checkAppendOnlyReceipts,
  checkReceiptsSchema,
  validateReceiptShape,
  verifyReceiptSubjectHashes,
} from "../lib/reviewIntegrityCheck";
import { getLessonReviewStatus, reviewReceipts, type ReviewReceipt } from "../lib/reviewReceipts";
import { isGitAvailable, objectExists, readFileAtCommit, readLessonAtCommit, resolveCommit } from "./git-lesson";

/**
 * RECEIPT-INTEGRITY kanalı — bu script yalnız bunu denetler.
 *
 * "İki kanala böl" kararı (Sprint 0): bu dosya eskiden hem gerçek makbuz
 * tahrifatını (hash/şema/sourceCommit/rol/append-only) hem de kapsam
 * (coverage) bilgisini (legacy kaynak borcu, eksik makbuz bookkeeping'i) tek
 * bir REVIEW_STRICT bayrağının arkasında karıştırıyordu. Bunun sonucu:
 * REVIEW_STRICT=1'i açmak, 47 zararsız "legacy kaynak" uyarısını da fatal
 * yapıp CI'ı kilitliyordu — üretim niyeti (gerçek tahrifatı yakalamak) ile
 * sonuç (kapsam raporunun CI'ı kırması) örtüşmüyordu.
 *
 * Artık ayrım net: BU dosyadaki her hata bir makbuzun kendisiyle ilgili bir
 * bütünlük sorunudur (bkz. lib/reviewIntegrityCheck.ts) ve HER ZAMAN
 * fatal'dır — REVIEW_STRICT'e bağlı değildir, çünkü tahrif edilmiş bir
 * makbuz asla "bilgilendirici" bir durum değildir. Kapsam/borç raporlama
 * (eksik makbuz, legacy kaynak) scripts/check-review-debt.ts'e taşındı ve
 * orada her zaman yalnız rapor, asla fatal.
 */
const APPEND_ONLY_BASE = process.env.REVIEW_APPEND_ONLY_BASE ?? "origin/main";

const lessons = getAllLessons();
const lessonSlugs = new Set(lessons.map((lesson) => lesson.slug));
const lessonsById = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
const errors: string[] = [];
const notes: string[] = [];
const gitReady = isGitAvailable();

errors.push(...checkReceiptsSchema(reviewReceipts));

const seenIds = new Set<string>();
for (const receipt of reviewReceipts.receipts) {
  const shapeErrors = validateReceiptShape(receipt, lessonSlugs, seenIds);
  errors.push(...shapeErrors);
  if (shapeErrors.length === 0) verifySourceCommit(receipt);
}

checkAppendOnly();

if (errors.length > 0) {
  console.error(`Review makbuzu bütünlüğü ${errors.length} hata üretti (fatal):\n${errors.map((error) => `  - ${error}`).join("\n")}`);
  process.exit(1);
}

for (const note of notes) console.log(`  not: ${note}`);
const kapsanan = lessons.filter(
  (lesson) => lesson.frontmatter.durum === "yayinda" && getLessonReviewStatus(lesson).state === "verified",
).length;
const yayinSayisi = lessons.filter((lesson) => lesson.frontmatter.durum === "yayinda").length;
console.log(
  `Review makbuzu bütünlüğü: temiz. ${reviewReceipts.receipts.length} kapsam makbuzu, ` +
    `${yayinSayisi} yayının ${kapsanan}'i güncel makbuzlu. ` +
    `Eksik makbuz burada hata sayılmaz — bkz. \`npm run check-review-debt\`.`,
);

/**
 * `sourceCommit` gerçekten bu makbuzun bağlandığı hash'leri üreten commit mi?
 *
 * Yalnız biçim kontrolü, uydurma bir SHA'yı kabul eder. Commit nesnesi elde
 * varsa dersi o commit'ten okuyup kökleri yeniden hesaplıyoruz ve
 * verifyReceiptSubjectHashes ile karşılaştırıyoruz — uyuşmazlık tahrif
 * edilmiş (veya yanlış derse/sürüme bağlanmış) bir makbuzun kanıtıdır.
 */
function verifySourceCommit(receipt: ReviewReceipt): void {
  const label = receipt.id;
  const lesson = lessonsById.get(receipt.lessonId)!;
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
  errors.push(...verifyReceiptSubjectHashes(receipt, computeLessonSubjectHashes(historical)));
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
  errors.push(...checkAppendOnlyReceipts(previous, reviewReceipts.receipts));
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
