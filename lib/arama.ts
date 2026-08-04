/**
 * Arama mantığı — indeksin hazırlanması, sorgunun normalleştirilmesi ve
 * eşleştirme. Site statik olarak yayınlandığı için sunucu tarafı arama yok:
 * `scripts/build-search-index.ts` derleme öncesi `public/arama-index.json`
 * üretir, `app/ara/page.tsx` onu tembel yükleyip bu dosyadaki fonksiyonlarla
 * filtreler (bkz. docs/02-mimari.md "hesaplama tarayıcıda").
 *
 * Bu dosya saf TypeScript: `window`/`document`/React importu yok. Hem Node
 * tarafındaki derleme script'i hem tarayıcıdaki bileşen aynı normalleştirmeyi
 * kullanabilsin diye böyle — iki yerde ayrı ayrı yazılırsa eşleşme sessizce
 * bozulur.
 */

/**
 * Türkçe harfleri ASCII karşılığına indirir. Amaç: "olcum" yazan kullanıcı
 * "ölçüm" geçen dersi bulabilsin. Her eşleme tek karakter → tek karakter;
 * bu sayede normalleştirilmiş metindeki bir indis, orijinal metinde de aynı
 * yeri gösterir (parça/snippet çıkarmak buna dayanıyor).
 */
const HARF_ESLEME: Record<string, string> = {
  ı: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
  â: "a",
  Â: "a",
  î: "i",
  Î: "i",
  û: "u",
  Û: "u",
};

export function aramaNormalize(metin: string): string {
  return metin.replace(/[ıİşŞğĞüÜöÖçÇâÂîÎûÛ]/g, (harf) => HARF_ESLEME[harf] ?? harf).toLowerCase();
}

/**
 * Bir MDX gövdesini, arama için düz metne indirger.
 * `scripts/build-search-index.ts` derleme zamanında kullanır; burada durmasının
 * sebebi test edilebilir olması (`lib/arama.test.ts`).
 */
export function mdxDuzMetne(govde: string): string {
  return (
    govde
      // Kod blokları: dilin sözdizimi arama sonucunda gürültü yapıyor.
      .replace(/```[\s\S]*?```/g, " ")
      // Etkileşimli bileşenler (hepsi kendi kapanan — `</Tag>` deseni yok).
      // Quiz prop'ları içindeki soru metinleri de böylece dışarıda kalıyor;
      // arama ders anlatımında eşleşsin, alıştırma seçeneklerinde değil.
      .replace(/<[A-Z][\s\S]*?\/>/g, " ")
      // Markdown bağlantısı → sadece görünen metin.
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Başlık işaretleri, alıntı okları, liste imleri, vurgu, satır içi kod.
      .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
      .replace(/^[ \t]*>[ \t]?/gm, "")
      .replace(/^[ \t]*[-*+][ \t]+/gm, "")
      .replace(/[*_`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** `public/arama-index.json` içindeki bir kayıt — derleme zamanında üretilir. */
export interface AramaKaydiHam {
  id: string;
  baslik: string;
  hat: string;
  hatEtiket: string;
  seviye: string;
  seviyeEtiket: string;
  sure: number;
  /** Dersin MDX gövdesinden çıkarılmış düz metin. */
  metin: string;
}

/** Ham kayıt + tarayıcıda bir kez hesaplanan normalleştirilmiş alanlar. */
export interface AramaKaydi extends AramaKaydiHam {
  baslikNorm: string;
  metinNorm: string;
}

export interface AramaSonuc {
  kayit: AramaKaydi;
  skor: number;
  /** Eşleşmenin geçtiği yerden alınmış kısa bağlam metni. */
  parca: string;
}

/**
 * Normalleştirilmiş alanlar JSON'a yazılmaz (dosyayı iki katına çıkarırdı),
 * indeks yüklendiğinde bir kez burada hesaplanır.
 */
export function indeksHazirla(ham: AramaKaydiHam[]): AramaKaydi[] {
  return ham.map((kayit) => ({
    ...kayit,
    baslikNorm: aramaNormalize(kayit.baslik),
    metinNorm: aramaNormalize(`${kayit.baslik} ${kayit.hatEtiket} ${kayit.metin}`),
  }));
}

const BASLIK_PUANI = 3;
const METIN_PUANI = 1;
const PARCA_YARICAP = 70;

function parcaCikar(kayit: AramaKaydi, kelime: string): string {
  const konum = aramaNormalize(kayit.metin).indexOf(kelime);
  if (konum === -1) return kayit.metin.slice(0, PARCA_YARICAP * 2).trim();

  const bas = Math.max(0, konum - PARCA_YARICAP);
  const son = Math.min(kayit.metin.length, konum + kelime.length + PARCA_YARICAP);
  const govde = kayit.metin.slice(bas, son).trim();
  return `${bas > 0 ? "…" : ""}${govde}${son < kayit.metin.length ? "…" : ""}`;
}

/**
 * Sorgudaki her kelime en az bir alanda geçmeli (VE mantığı). Başlıkta geçen
 * kelime daha yüksek puan alır. Sonuçlar puana, eşitlikte başlığa göre sıralı.
 */
export function aramaYap(indeks: AramaKaydi[], sorgu: string, limit = 20): AramaSonuc[] {
  const kelimeler = aramaNormalize(sorgu)
    .split(/\s+/)
    .filter((kelime) => kelime.length > 0);
  if (kelimeler.length === 0) return [];

  const sonuclar: AramaSonuc[] = [];

  for (const kayit of indeks) {
    let skor = 0;
    let eksikVar = false;

    for (const kelime of kelimeler) {
      const baslikta = kayit.baslikNorm.includes(kelime);
      const metinde = kayit.metinNorm.includes(kelime);
      if (!baslikta && !metinde) {
        eksikVar = true;
        break;
      }
      skor += baslikta ? BASLIK_PUANI : METIN_PUANI;
    }

    if (eksikVar) continue;
    sonuclar.push({ kayit, skor, parca: parcaCikar(kayit, kelimeler[0]) });
  }

  return sonuclar
    .sort((a, b) => b.skor - a.skor || a.kayit.baslik.localeCompare(b.kayit.baslik, "tr"))
    .slice(0, limit);
}
