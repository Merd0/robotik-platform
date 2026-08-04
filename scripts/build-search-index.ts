import fs from "node:fs";
import path from "node:path";
import { getAllLessons, hatEtiket, SEVIYE_ETIKET } from "../lib/content";
import { mdxDuzMetne, type AramaKaydiHam } from "../lib/arama";

/**
 * Ders içeriğinden statik bir arama indeksi (`public/arama-index.json`) üretir.
 *
 * Neden derleme zamanında: site statik olarak dışa aktarılıyor, sunucu tarafı
 * arama uç noktası yok. Neden ayrı bir JSON dosyası (JS bundle'ına gömmek
 * yerine): docs/05'teki "ilk yükleme JS < 200 KB" bütçesi. İndeks sadece
 * /ara sayfası açıldığında, `fetch` ile tembel yükleniyor.
 *
 * `predev` / `prebuild` içinde çalışır — public/workers/ ve public/pyodide/
 * ile aynı desen (üretilen dosya, kaynak değil; .gitignore'da).
 *
 * Not: dosya izlemez. Bir ders metnini değiştirip aramada görmek istiyorsan
 * dev sunucusunu yeniden başlat.
 */

const CIKTI = path.join(process.cwd(), "public", "arama-index.json");

function main(): void {
  // Sitenin geri kalanıyla aynı kural: sadece insan gözden geçirmesinden
  // geçmiş dersler listelenir (bkz. app/page.tsx, app/seviye/[seviye]/page.tsx).
  // Taslak dersler doğrudan URL ile hâlâ açılabilir, ama aranamaz.
  const dersler = getAllLessons().filter((ders) => ders.frontmatter.durum === "yayinda");

  const kayitlar: AramaKaydiHam[] = dersler
    .map((ders) => ({
      id: ders.slug,
      baslik: ders.frontmatter.baslik,
      hat: ders.frontmatter.hat,
      hatEtiket: hatEtiket(ders.frontmatter.hat),
      seviye: ders.frontmatter.seviye,
      seviyeEtiket: SEVIYE_ETIKET[ders.frontmatter.seviye],
      sure: ders.frontmatter.sure,
      metin: [...(ders.frontmatter.kazanimlar ?? []), mdxDuzMetne(ders.body)].join(" "),
    }))
    .sort((a, b) => a.id.localeCompare(b.id, "tr"));

  fs.mkdirSync(path.dirname(CIKTI), { recursive: true });
  fs.writeFileSync(CIKTI, JSON.stringify(kayitlar), "utf8");

  const boyutKb = (fs.statSync(CIKTI).size / 1024).toFixed(1);
  console.log(`Arama indeksi yazıldı: ${kayitlar.length} ders, ${boyutKb} KB → public/arama-index.json`);
}

main();
