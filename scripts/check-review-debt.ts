import { getAllLessons } from "../lib/content";
import { reviewDebt } from "../lib/reviewDebt";
import { createHash } from "node:crypto";

const FROZEN_LEGACY_DEBT_FINGERPRINT = "dbd7dcbba1edadc97b10b578879f8eee129bf3d976914278b399e8e7ac73a717";

const publishedIds = getAllLessons()
  .filter((lesson) => lesson.frontmatter.durum === "yayinda")
  .map((lesson) => lesson.slug)
  .sort();
const recordedIds = [
  ...reviewDebt.staleAfterContentChange,
  ...reviewDebt.legacyUnverified,
].sort();
const debtFingerprint = createHash("sha256").update(recordedIds.join("\n"), "utf8").digest("hex");

const duplicates = recordedIds.filter((id, index) => recordedIds.indexOf(id) !== index);
const missing = publishedIds.filter((id) => !recordedIds.includes(id));
const extra = recordedIds.filter((id) => !publishedIds.includes(id));
if (debtFingerprint !== FROZEN_LEGACY_DEBT_FINGERPRINT) {
  console.error("Review borcu baseline kümesi değişti. Yeni ders legacy borca eklenemez; güncel Review Receipt gerekir.");
  process.exit(1);
}

if (duplicates.length || missing.length || extra.length) {
  console.error("Review borcu kaydı yayın kümesiyle uyuşmuyor.");
  if (duplicates.length) console.error(`  Yinelenen: ${[...new Set(duplicates)].join(", ")}`);
  if (missing.length) console.error(`  Kaydı eksik yayınlar: ${missing.join(", ")}`);
  if (extra.length) console.error(`  Yayında olmadığı hâlde kayıtlı: ${extra.join(", ")}`);
  process.exit(1);
}

console.log(
  `Review borcu kaydı temiz: ${reviewDebt.staleAfterContentChange.length} değişiklik sonrası eski, ` +
    `${reviewDebt.legacyUnverified.length} sürüme bağlanmamış legacy kayıt.`,
);
