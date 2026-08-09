import fs from "node:fs";
import path from "node:path";

/**
 * `content/` altındaki ders metinlerinde kaynak gizliliği kuralını ihlal eden
 * kalıpları arar.
 *
 * Neden var: `docs/00-vizyon.md`'deki mutlak kural — platformdaki her teknik
 * bilgi herkese açık bir kaynağa dayanmalı; iş yeri/kurum/staj kaynaklı
 * hiçbir bilgi (kurulum detayı, ekipman envanteri, saha bağlamı) yayınlanmaz.
 * `docs/08-guvenlik-sertlestirme.md` bölüm 6 bu kural için "insan hatasını
 * yakalayan ikinci bir güvenlik ağı" olarak bu betiği öngörüyordu.
 *
 * Betiği yazdıran somut olay: `ca7335a` commit'iyle iki üniversite dersinin
 * "Gerçek dünyada" bölümüne, bir iş yeri/staj deneyimine dayanan cümle girdi
 * ve bunlardan biri (`b-universite-jacobian`) `durum: yayinda` olduğu için
 * canlı siteye çıktı. Kural insan tarafından biliniyordu ama hiçbir otomatik
 * kontrol yakalamadı. (Sızan cümle burada tekrar edilmiyor; ayrıntı için
 * `git log ca7335a` ve düzeltme commit'i `feb6404`.)
 *
 * İkinci iş: kişiye özel/samimi ton sızmaları. Dersi okuyan kişi platformun
 * sahibi değil, tanımadığımız bir öğrenci — `docs/04-icerik-rehberi.md`'deki
 * dil kuralları gereği anlatı nötr üçüncü kişi olmalı, kişisel anekdot veya
 * platform sahibine selam olmamalı.
 *
 * Kapsam sınırı: bu betik bir kalıp taramasıdır, anlam denetimi değil. Listede
 * olmayan bir kurum adını yakalayamaz. İnsan gözden geçirmesinin
 * (`docs/06-kalite-ve-topluluk.md` Katman 3) yerine geçmez, onu tamamlar.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

interface Kural {
  /** Bulgu mesajında görünen kısa ad. */
  ad: string;
  desen: RegExp;
  aciklama: string;
  /**
   * Bu frontmatter alanlarında eşleşme yok sayılır. Gerekçe: bazı alanlar
   * kuralın istisnasıdır — ör. `incelendi_tarafindan` dersin gözden
   * geçireni olarak bir kişi adı taşımak ZORUNDA (`docs/06`), bu bir
   * sızıntı değil kalite kaydıdır.
   */
  istisnaAlanlar?: string[];
}

/**
 * Bakımcı tarafından tanımlanan liste (`docs/08` bölüm 6). Yeni bir kurum,
 * iç sistem veya proje kod adı buraya eklenir.
 *
 * Buradaki desenler yalnızca HERKESE AÇIK adları içerir. Gerçekten gizli
 * olan iç proje kod adları bu listeye YAZILMAZ — repo açık kaynak olduğu
 * için listenin kendisi de yayınlanıyor; gizli bir adı buraya eklemek onu
 * ifşa etmek olurdu. Böyle bir tarama gerekirse CI secret'ı veya kurum içi
 * bir kontrol olarak tutulur.
 *
 * Sözcük sınırı için `\b` DEĞİL, `(?<!\p{L})` / `(?!\p{L})` lookaround'ları
 * ve `u` bayrağı kullanılıyor. Sebebi Türkçeye özgü ve sessizce yanlış
 * sonuç veriyor: `\b` yalnızca ASCII `\w` sınıfına göre sınır arar, bu
 * yüzden "ç/ş/ı/ğ" gibi harflerle BAŞLAYAN bir desende `\b` hiçbir zaman
 * eşleşmez — "Çalıştığım şirket" kalıbı `\b` ile yazıldığında tarama
 * temiz görünüyordu.
 *
 * Sözcük sonuna sınır konulup konulmaması bilinçli: "staj" deseni ek
 * alabilsin diye açık uçlu ("stajında", "stajyer"), "Mert" ise kapalı
 * ("mertebesinde" masum bir sözcük, eşleşmemeli).
 *
 * `i` bayrağı Türkçe nokta lı/sız İ çiftini kapsamaz (U+0130 Unicode
 * katlamada kendine eşlenir); bu yüzden cümle başında büyük harfle
 * başlayabilecek kalıplarda `[iİ]` gibi açık karakter sınıfı yazıldı.
 */
const KURALLAR: Kural[] = [
  {
    ad: "kurum adı",
    desen: /(?<!\p{L})ASELSAN(?!\p{L})/giu,
    aciklama: "İş yeri/kurum adı ders metnine giremez (docs/00-vizyon.md).",
  },
  {
    ad: "iç birim/sistem adı",
    desen: /(?<!\p{L})MEOS(?!\p{L})/gu,
    aciklama: "İş yerine ait birim veya sistem adı ders metnine giremez (docs/00-vizyon.md).",
  },
  {
    ad: "staj bağlamı",
    desen: /(?<!\p{L})[sS]taj/gu,
    aciklama:
      "Staj/iş yeri deneyimi bir kaynak değildir; iddia herkese açık bir kaynağa dayanmalı (docs/04-icerik-rehberi.md).",
  },
  {
    ad: "kişisel ton",
    desen: /(?<!\p{L})Mert(?!\p{L})/gu,
    aciklama:
      "Ders metni platform sahibine değil, tanımadığımız bir öğrenciye seslenir; kişisel anekdot kullanma (docs/04-icerik-rehberi.md).",
    istisnaAlanlar: ["incelendi_tarafindan"],
  },
  {
    ad: "kişisel ton",
    desen:
      /(?<!\p{L})(?:[iİ]ş ?yerim|[çÇ]alıştığım (?:şirket|firma|hat)|kendi deneyimimde|bizzat gördüğüm)/giu,
    aciklama:
      "Birinci ağızdan iş yeri deneyimi hem kaynaksız hem kişisel; nötr üçüncü kişi anlatıma çevir (docs/04-icerik-rehberi.md).",
  },
];

interface Bulgu {
  dosya: string;
  satir: number;
  kural: Kural;
  eslesme: string;
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
 * Satırın frontmatter içinde olup olmadığını ve hangi alana ait olduğunu
 * belirler. Frontmatter, dosyanın ilk satırındaki `---` ile bir sonraki
 * `---` arasındaki bloktur.
 */
function frontmatterAlanlari(satirlar: string[]): (string | null)[] {
  const alanlar: (string | null)[] = new Array(satirlar.length).fill(null);
  if (satirlar[0]?.trim() !== "---") return alanlar;

  let sonAlan: string | null = null;
  for (let i = 1; i < satirlar.length; i += 1) {
    if (satirlar[i].trim() === "---") break;
    const alanBasi = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(satirlar[i]);
    // Liste öğesi ("  - ...") kendinden önceki alana ait sayılır.
    if (alanBasi) sonAlan = alanBasi[1];
    alanlar[i] = sonAlan;
  }
  return alanlar;
}

function dosyayiDenetle(dosya: string): Bulgu[] {
  const satirlar = fs.readFileSync(dosya, "utf8").split(/\r?\n/);
  const alanlar = frontmatterAlanlari(satirlar);
  const bulgular: Bulgu[] = [];

  satirlar.forEach((satir, i) => {
    for (const kural of KURALLAR) {
      const alan = alanlar[i];
      if (alan && kural.istisnaAlanlar?.includes(alan)) continue;

      kural.desen.lastIndex = 0;
      for (const eslesme of satir.matchAll(kural.desen)) {
        bulgular.push({
          dosya: path.relative(process.cwd(), dosya),
          satir: i + 1,
          kural,
          eslesme: eslesme[0],
        });
      }
    }
  });

  return bulgular;
}

function main(): void {
  const dosyalar = mdxDosyalari(CONTENT_DIR);
  const bulgular = dosyalar.flatMap(dosyayiDenetle);

  if (bulgular.length > 0) {
    console.error(`Hassas terim denetimi ${bulgular.length} bulgu buldu:\n`);
    for (const b of bulgular) {
      console.error(`  ${b.dosya}:${b.satir} — [${b.kural.ad}] "${b.eslesme}"`);
      console.error(`      ${b.kural.aciklama}`);
    }
    console.error(
      "\nKaynak gizliliği kuralı: iş yeri/kurum/staj kaynaklı hiçbir bilgi " +
        "yayınlanmaz (docs/00-vizyon.md, docs/08-guvenlik-sertlestirme.md bölüm 6).",
    );
    process.exit(1);
  }

  console.log(`Hassas terim denetimi temiz: ${dosyalar.length} ders dosyası.`);
}

main();
