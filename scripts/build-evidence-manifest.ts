import fs from "node:fs";
import path from "node:path";
import { getAllLessons } from "../lib/content";
import { computeTeachingHash } from "../lib/lessonArtifact";
import { EVIDENCE_PREDICATES } from "../lib/evidence";

/**
 * Her dersin GÜNCEL `teachingHash`'ini ve bağlı predicate id'lerini
 * `public/evidence-manifest.json`'a yazar.
 *
 * Neden gerekli: `app/kanit-okuyucu` sayfası (Evidence JSON Okuyucu, Sprint 2)
 * kullanıcının dışa aktardığı bir kanıt dosyasının "güncel mi, eski sürüm mü"
 * olduğunu söyleyebilmek için dersin GÜNCEL sürümünü bilmeli. `lib/content.ts`
 * (fs okur) tarayıcıya gömülemez; `public/arama-index.json` ile birebir aynı
 * desen — derleme zamanında üretilen, `fetch` ile tembel yüklenen ayrı bir
 * JSON dosyası (bkz. scripts/build-search-index.ts).
 *
 * `predev` / `prebuild` içinde çalışır. Üretilen dosya, kaynak değil —
 * `.gitignore`'da (bkz. public/workers/, public/arama-index.json ile aynı kural).
 */

const CIKTI = path.join(process.cwd(), "public", "evidence-manifest.json");

interface ManifestEntry {
  teachingHash: string;
  predicateIds: string[];
  durum: string;
}

function main(): void {
  const dersler = getAllLessons();
  const manifest: Record<string, ManifestEntry> = {};

  for (const ders of dersler) {
    const predicateIds = EVIDENCE_PREDICATES.filter((predicate) => predicate.lessonId === ders.slug)
      .map((predicate) => predicate.id)
      .sort();
    manifest[ders.slug] = {
      teachingHash: computeTeachingHash(ders),
      predicateIds,
      durum: ders.frontmatter.durum,
    };
  }

  fs.mkdirSync(path.dirname(CIKTI), { recursive: true });
  fs.writeFileSync(CIKTI, JSON.stringify(manifest), "utf8");

  const boyutKb = (fs.statSync(CIKTI).size / 1024).toFixed(1);
  console.log(`Kanıt manifesti yazıldı: ${dersler.length} ders, ${boyutKb} KB → public/evidence-manifest.json`);
}

main();
