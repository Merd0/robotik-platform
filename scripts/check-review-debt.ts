import { createHash } from "node:crypto";
import { getAllLessons } from "../lib/content";
import { getOpenReviewDebtIds, reviewDebt } from "../lib/reviewDebt";
import { getLessonReviewStatus } from "../lib/reviewReceipts";

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

const errors: string[] = [];
const lessons = getAllLessons();
const publishedLessons = lessons.filter((lesson) => lesson.frontmatter.durum === "yayinda");
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

/**
 * Bu kontrol de artık bir yayın kapısı değil (bkz. check-review-integrity.ts
 * başındaki not ve docs/06 "Katman 3"). Dondurulmuş baseline'ın bütünlüğü
 * hâlâ raporlanıyor — o bir tarih kaydı ve bozulması bir veri hatasıdır —
 * ama yayını engellemiyor. `REVIEW_STRICT=1` eski davranışı geri getirir.
 */
const strict = process.env.REVIEW_STRICT === "1";

if (errors.length > 0) {
  console.warn(
    `Review borcu kaydı ${errors.length} ${strict ? "hata" : "uyarı"} üretti:\n${errors.map((error) => `  - ${error}`).join("\n")}`,
  );
  if (strict) process.exit(1);
}

const cleared = baselineIds.length - openDebtIds.length;
const makbuzlu = publishedLessons.filter((lesson) => getLessonReviewStatus(lesson).state === "verified").length;
console.log(
  `Review borcu (bilgi): ${reviewDebt.staleAfterContentChange.length} değişiklik sonrası eski, ` +
    `${reviewDebt.legacyUnverified.length} sürüme bağlanmamış legacy kayıt; ` +
    `${cleared}/${baselineIds.length} baseline borcu kapandı. ` +
    `${publishedLessons.length} yayının ${makbuzlu}'i güncel makbuzlu.`,
);
