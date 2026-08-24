import fs from "node:fs";
import path from "node:path";
import { getAllLessons, HAT_ETIKET, hatEtiket, SEVIYE_ETIKET } from "../lib/content";
import type { ContinueLesson } from "../lib/continueLearning";

/**
 * "Kaldığın yerden devam et" panelinin ders çözümleme tablosunu üretir.
 *
 * Neden ayrı bir dosya, ana sayfa prop'u değil: kullanıcının yerel kanıt
 * kaydındaki son olay 89 dersten HERHANGİ birine ait olabilir — hangisi
 * olduğu yalnız tarayıcıda, localStorage okunduktan sonra bilinir. Bunu
 * derleme zamanında ana sayfaya prop olarak geçirmek (önceki mimari) React
 * Server Components flight payload'ını doğrudan sayfa HTML'ine gömüyordu:
 * 89 dersin tamamı, ziyaretçinin kaydı olsun olmasın, her ana sayfa
 * yüklemesinde iniyordu. `check-performance-budget.ts`'in yakaladığı
 * regresyon buydu (htmlBytes bütçeyi aştı).
 *
 * Çözüm `public/arama-index.json` ile birebir aynı desen: veri, derleme
 * zamanında ayrı bir statik dosyaya yazılır; istemci bileşeni bunu YALNIZ
 * gerçekten bir kanıt kaydı olduğunda (bkz. ContinueLearning.tsx) `fetch`
 * ile tembel yükler. Böylece kaydı olmayan (çoğunluk) ziyaretçi hiç
 * indirmez, kaydı olan ziyaretçi ayrı, önbelleklenebilir bir istekle alır —
 * sayfa HTML'i şişmez.
 *
 * `predev` / `prebuild` içinde çalışır. Üretilen dosya kaynak değil,
 * `.gitignore`'da (public/arama-index.json, public/evidence-manifest.json
 * ile aynı kural).
 */

const CIKTI = path.join(process.cwd(), "public", "devam-index.json");

function main(): void {
  // Yalnız yayımlı dersler: taslak bir dersin slug'ı zaten hiçbir kanıt
  // olayında oluşamaz (ders sayfası üretime girmedi), ama aynı editoryal
  // kural burada da tutarlılık için uygulanır.
  const dersler = getAllLessons().filter((ders) => ders.frontmatter.durum === "yayinda");
  const hatSirasi = Object.keys(HAT_ETIKET);

  const kayitlar: ContinueLesson[] = dersler
    .map((ders) => ({
      slug: ders.slug,
      baslik: ders.frontmatter.baslik,
      seviye: ders.frontmatter.seviye,
      seviyeEtiketi: SEVIYE_ETIKET[ders.frontmatter.seviye],
      hatIndex: hatSirasi.indexOf(ders.frontmatter.hat),
      hatEtiketi: hatEtiket(ders.frontmatter.hat),
      sira: ders.frontmatter.sira ?? 0,
      onkosul: ders.frontmatter.onkosul,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug, "tr"));

  fs.mkdirSync(path.dirname(CIKTI), { recursive: true });
  fs.writeFileSync(CIKTI, JSON.stringify(kayitlar), "utf8");

  const boyutKb = (fs.statSync(CIKTI).size / 1024).toFixed(1);
  console.log(`Devam indeksi yazıldı: ${kayitlar.length} ders, ${boyutKb} KB → public/devam-index.json`);
}

main();
