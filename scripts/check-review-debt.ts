import { createHash } from "node:crypto";
import { getAllLessons } from "../lib/content";
import { getOpenReviewDebtIds, reviewDebt } from "../lib/reviewDebt";
import { findLegacyTextSources, getLessonReviewStatus } from "../lib/reviewReceipts";

/**
 * REVIEW-COVERAGE / SOURCE-MIGRATION kanalı — bu script yalnız bunu raporlar.
 *
 * "İki kanala böl" kararı (Sprint 0): bu dosya artık hem borç
 * baseline'ının bookkeeping'ini hem de (eskiden check-review-integrity.ts'de
 * yaşayan) "legacy düz metin kaynak kullanan yayın" ve "borç kaydı
 * temizlenmemiş" kapsam uyarılarını taşıyor. İkisi de aynı doğaya sahip:
 * bir dersin insan incelemesi veya kaynak biçimi eksik/eski — bu asla
 * tahrifat değil, sadece bir kapsam boşluğu (docs/06-kalite-ve-topluluk.md
 * "Katman 3": insan incelemesi opsiyonel).
 *
 * Bu yüzden bu kanal HER ZAMAN yalnız rapor eder ve exit 0 ile biter —
 * REVIEW_STRICT'e bağlı DEĞİLDİR. Gerçek tahrifat (hash/şema/sourceCommit/
 * rol/append-only) scripts/check-review-integrity.ts'e ait ve orası her
 * zaman fatal'dır.
 */
const errors: string[] = [];
const lessons = getAllLessons();
const publishedLessons = lessons.filter((lesson) => lesson.frontmatter.durum === "yayinda");

/**
 * DEĞİŞMEZ ÇIPA — asla yeniden hesaplanmaz.
 *
 * Bu sabit, 2026-08-09'da dondurulmuş legacy borç BASELINE'ının parmak izidir
 * (`content/review-debt.json` → `baselineIds`, 39 ders). v1'de aynı sabit
 * GÜNCEL borç kümesini donduruyordu; o yüzden bir dersi onaylayıp borçtan
 * çıkarmak bu script'i düzenlemeyi gerektiriyordu (docs/09 §7'ye göre elle
 * onay isteyen bir governance değişikliği — 39 kez).
 *
 * Artık kural iki parçalı:
 *   1. baseline değişmez (bu sabit onu kanıtlar),
 *   2. güncel borç baseline'ın alt kümesidir ve yalnız küçülebilir.
 *
 * Böylece "yeni ders sessizce borç listesine eklenemez" güvencesi aynen
 * korunur, ama borç eritmek hiçbir kod değişikliği istemez.
 */
const BASELINE_FINGERPRINT = "dbd7dcbba1edadc97b10b578879f8eee129bf3d976914278b399e8e7ac73a717";

const baselineIds = [...reviewDebt.baselineIds].sort();
const baselineFingerprint = createHash("sha256").update(baselineIds.join("\n"), "utf8").digest("hex");
const openDebtIds = getOpenReviewDebtIds();
const baseline = new Set(baselineIds);

if (reviewDebt.schemaVersion !== 2) {
  errors.push("review-debt.json şema sürümü 2 olmalı.");
}
if (baselineFingerprint !== BASELINE_FINGERPRINT) {
  errors.push(
    "Dondurulmuş legacy borç baseline'ı değişti. baselineIds değiştirilemez; yeni ders legacy borca eklenemez, güncel Review Receipt gerekir.",
  );
}
if (reviewDebt.baselineFingerprint !== BASELINE_FINGERPRINT) {
  errors.push("review-debt.json içindeki baselineFingerprint, dondurulmuş baseline ile uyuşmuyor.");
}

const duplicates = [...new Set(openDebtIds.filter((id, index) => openDebtIds.indexOf(id) !== index))];
if (duplicates.length) errors.push(`Güncel borçta yinelenen kayıt: ${duplicates.join(", ")}`);

const outsideBaseline = openDebtIds.filter((id) => !baseline.has(id));
if (outsideBaseline.length) {
  errors.push(`Baseline dışında borç kaydı (borç yalnız küçülebilir): ${outsideBaseline.join(", ")}`);
}

// Borç kaydında olup güncel makbuzu da olan ders bir tutarsızlıktır (kayıt
// temizlenmemiş demektir). Yayında olup hiç kaydı olmaması ise artık normal:
// insan incelemesi zorunlu değil.
const openDebt = new Set(openDebtIds);
for (const lesson of publishedLessons) {
  if (openDebt.has(lesson.slug) && getLessonReviewStatus(lesson).state === "verified") {
    errors.push(`${lesson.slug}: güncel makbuz var; borç kaydı kaldırılmalı (npm run review onayla bunu kendisi yapar).`);
  }
}

// scripts/check-review-integrity.ts'den taşındı: yeni yayınlarda kaynaklar
// yapılandırılmış SourceRef olmalı. Legacy borç kaydındaki (baseline)
// dersler bu kuraldan muaf — onların düz metin kaynağı zaten bilinen,
// dondurulmuş bir borçtur.
for (const lesson of publishedLessons) {
  if (!openDebt.has(lesson.slug) && findLegacyTextSources(lesson).length > 0) {
    errors.push(`${lesson.slug}: yeni yayınlarda kaynaklar yapılandırılmış SourceRef olmalı; legacy metin kaynak kabul edilmez.`);
  }
}

const cleared = baselineIds.length - openDebtIds.length;
const makbuzlu = publishedLessons.filter((lesson) => getLessonReviewStatus(lesson).state === "verified").length;

if (errors.length > 0) {
  console.warn(`Review kapsamı (bilgi, kapı değil) ${errors.length} not üretti:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
}

console.log(
  `Review borcu (bilgi): ${reviewDebt.staleAfterContentChange.length} değişiklik sonrası eski, ` +
    `${reviewDebt.legacyUnverified.length} sürüme bağlanmamış legacy kayıt; ` +
    `${cleared}/${baselineIds.length} baseline borcu kapandı. ` +
    `${publishedLessons.length} yayının ${makbuzlu}'i güncel makbuzlu. ` +
    `İnsan incelemesi opsiyonel; bu script hiçbir zaman build'i kırmaz.`,
);
