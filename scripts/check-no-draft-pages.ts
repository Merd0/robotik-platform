import fs from "node:fs";
import path from "node:path";
import { getAllLessons } from "../lib/content";

/**
 * Üretim derlemesinde taslak bir dersin sayfası ÜRETİLMEMİŞ olmalı.
 *
 * Neden ayrı bir script: `getPublicLessons` üzerindeki birim testleri
 * mantığın doğru olduğunu gösterir, ama gerçek güvence derleme çıktısındadır.
 * Bu script `out/` klasörünü açıp bakar — bir slug için dosya varsa o sayfa
 * yayında demektir, kim ne niyetle üretmiş olursa olsun.
 *
 * `docs/06-kalite-ve-topluluk.md` Katman 3: insan gözden geçirmesinden
 * geçmemiş bir ders yayınlanamaz. Bu, o kuralın derleme çıktısı üzerinde
 * doğrulanmış hâli. Hat H (güvenlik) dersleri için özellikle önemli.
 *
 * Önizleme derlemesinde (ICERIK_TASLAK_ONIZLEME=1) kontrol atlanır — o
 * derleme zaten bilinçli olarak taslakları içerir ve yayına gitmez.
 */

const OUT_DIR = path.join(process.cwd(), "out");
const SITEMAP_PATH = path.join(OUT_DIR, "sitemap.xml");

function main(): void {
  if (process.env.ICERIK_TASLAK_ONIZLEME === "1") {
    console.log("Taslak önizleme derlemesi — taslak sayfa kontrolü atlandı.");
    return;
  }

  if (!fs.existsSync(OUT_DIR)) {
    console.error(
      "out/ bulunamadı. Bu kontrol derleme çıktısına bakar; önce `npm run build` çalıştır.",
    );
    process.exit(1);
  }

  const taslaklar = getAllLessons().filter((ders) => ders.frontmatter.durum !== "yayinda");
  const sizanlar: string[] = [];

  for (const ders of taslaklar) {
    // Next statik dışa aktarımda hem `ders/<slug>.html` hem
    // `ders/<slug>/index.html` biçimini üretebilir; ikisini de kontrol et.
    const adaylar = [
      path.join(OUT_DIR, "ders", `${ders.slug}.html`),
      path.join(OUT_DIR, "ders", ders.slug, "index.html"),
    ];
    const bulunan = adaylar.find((aday) => fs.existsSync(aday));
    if (bulunan) sizanlar.push(`${ders.slug} → ${path.relative(process.cwd(), bulunan)}`);
  }

  if (sizanlar.length > 0) {
    console.error(
      `HATA: ${sizanlar.length} taslak dersin sayfası üretim çıktısında yayında:\n` +
        sizanlar.map((satir) => `  - ${satir}`).join("\n") +
        "\n\nTaslak dersler herkese açık adreste bulunmamalı " +
        "(docs/06-kalite-ve-topluluk.md Katman 3).",
    );
    process.exit(1);
  }

  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error("HATA: out/sitemap.xml bulunamadı.");
    process.exit(1);
  }

  const sitemap = fs.readFileSync(SITEMAP_PATH, "utf8");
  const sitemapSizanlar = taslaklar
    .map((ders) => ders.slug)
    .filter((slug) => sitemap.includes(`/ders/${slug}`));

  if (sitemapSizanlar.length > 0) {
    console.error(
      `HATA: ${sitemapSizanlar.length} taslak ders sitemap.xml içinde listeleniyor:\n` +
        sitemapSizanlar.map((slug) => `  - ${slug}`).join("\n"),
    );
    process.exit(1);
  }

  console.log(
    `Taslak sayfa kontrolü temiz: ${taslaklar.length} taslak dersin hiçbiri ` +
      "üretim çıktısında veya sitemap.xml içinde yok.",
  );
}

main();
