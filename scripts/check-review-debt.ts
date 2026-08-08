import { getAllLessons } from "../lib/content";
import { reviewDebt } from "../lib/reviewDebt";

const publishedIds = getAllLessons()
  .filter((lesson) => lesson.frontmatter.durum === "yayinda")
  .map((lesson) => lesson.slug)
  .sort();
const recordedIds = [
  ...reviewDebt.staleAfterContentChange,
  ...reviewDebt.legacyUnverified,
].sort();

const duplicates = recordedIds.filter((id, index) => recordedIds.indexOf(id) !== index);
const missing = publishedIds.filter((id) => !recordedIds.includes(id));
const extra = recordedIds.filter((id) => !publishedIds.includes(id));

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
