import fs from "node:fs";
import path from "node:path";
import { karistir } from "../lib/quiz";

/**
 * Alıştırmalarda doğru cevabın şık konumu dağılımını denetler.
 *
 * Neden var: içerik denetiminde ölçüldü — 139 sorunun %89,2'sinde doğru
 * cevap 1. index'teydi. Öğrenci soruyu okumadan hep aynı şıkkı seçerek
 * ~%89 doğru yapabiliyordu.
 *
 * Bu script YAZILI index'e değil, öğrencinin GÖRDÜĞÜ index'e bakar: şıklar
 * `lib/quiz.ts` içindeki kararlı karıştırmadan geçtiği için ölçülmesi
 * gereken şey karıştırma sonrası dağılımdır. Böylece hem yanlılığı hem de
 * karıştırmanın bozulmasını (ör. kaldırılması) aynı kontrol yakalar.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");
/** Hiçbir şık konumu bu oranı aşmamalı. Rastgele 3 şıkta beklenen ~%33. */
const UST_SINIR = 0.5;

interface Soru {
  dosya: string;
  soru: string;
  secenekSayisi: number;
  yaziliDogru: number;
}

function mdxDosyalari(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const tam = path.join(dir, entry.name);
    if (entry.isDirectory()) return mdxDosyalari(tam);
    return entry.name.endsWith(".mdx") ? [tam] : [];
  });
}

/**
 * MDX içindeki `{ soru: "...", secenekler: [...], dogru: N, ... }` bloklarını
 * çıkarır. İçerik birinci taraf ve tutarlı biçimde yazıldığı için düzenli
 * ifade yeterli; buradaki iş güvenlik değil istatistik.
 */
function sorulariCikar(dosya: string): Soru[] {
  const metin = fs.readFileSync(dosya, "utf8");
  const sorular: Soru[] = [];
  const blokDeseni = /soru:\s*"((?:[^"\\]|\\.)*)"\s*,\s*secenekler:\s*\[([\s\S]*?)\]\s*,\s*dogru:\s*(\d+)/g;

  for (const eslesme of metin.matchAll(blokDeseni)) {
    const secenekGovdesi = eslesme[2];
    const secenekSayisi = [...secenekGovdesi.matchAll(/"(?:[^"\\]|\\.)*"/g)].length;
    if (secenekSayisi === 0) continue;
    sorular.push({
      dosya: path.relative(process.cwd(), dosya),
      soru: eslesme[1],
      secenekSayisi,
      yaziliDogru: Number(eslesme[3]),
    });
  }
  return sorular;
}

function main(): void {
  const sorular = mdxDosyalari(CONTENT_DIR).flatMap(sorulariCikar);

  if (sorular.length === 0) {
    console.error("Hiç alıştırma sorusu bulunamadı — ayrıştırıcı bozulmuş olabilir.");
    process.exit(1);
  }

  const yazili = new Map<number, number>();
  const gosterilen = new Map<number, number>();
  const hataliIndex: string[] = [];

  for (const s of sorular) {
    if (s.yaziliDogru < 0 || s.yaziliDogru >= s.secenekSayisi) {
      hataliIndex.push(`${s.dosya}: "dogru: ${s.yaziliDogru}" ama ${s.secenekSayisi} şık var`);
      continue;
    }
    yazili.set(s.yaziliDogru, (yazili.get(s.yaziliDogru) ?? 0) + 1);
    // Öğrencinin gördüğü konum: kararlı karıştırma uygulandıktan sonra.
    const sonuc = karistir(
      Array.from({ length: s.secenekSayisi }, (_, i) => String(i)),
      s.yaziliDogru,
      s.soru,
    );
    gosterilen.set(sonuc.dogru, (gosterilen.get(sonuc.dogru) ?? 0) + 1);
  }

  if (hataliIndex.length > 0) {
    console.error("HATA: geçersiz `dogru` index'i:\n" + hataliIndex.map((h) => `  - ${h}`).join("\n"));
    process.exit(1);
  }

  const toplam = sorular.length;
  const yazdir = (etiket: string, dagilim: Map<number, number>) => {
    const satirlar = [...dagilim.entries()]
      .sort(([a], [b]) => a - b)
      .map(([index, adet]) => `index ${index}: ${adet} (%${((adet / toplam) * 100).toFixed(1)})`);
    console.log(`  ${etiket}: ${satirlar.join(" · ")}`);
  };

  console.log(`${toplam} alıştırma sorusu tarandı.`);
  yazdir("içerikte yazılı", yazili);
  yazdir("öğrencinin gördüğü", gosterilen);

  const enYuksek = Math.max(...gosterilen.values());
  const oran = enYuksek / toplam;

  if (oran > UST_SINIR) {
    console.error(
      `\nHATA: doğru cevapların %${(oran * 100).toFixed(1)}'i tek bir şık konumunda ` +
        `(üst sınır %${UST_SINIR * 100}).\n` +
        "Öğrenci soruyu okumadan sabit bir şık seçerek yüksek puan alabilir.\n" +
        "lib/quiz.ts içindeki kararlı karıştırma devrede mi, kontrol et.",
    );
    process.exit(1);
  }

  console.log(`\nDağılım kabul edilebilir: en yüksek konum %${(oran * 100).toFixed(1)} (sınır %${UST_SINIR * 100}).`);
}

main();
