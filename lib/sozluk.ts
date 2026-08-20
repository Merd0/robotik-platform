import fs from "node:fs";
import path from "node:path";

/**
 * En yüksek arama niyetli terimlerde sıkça karıştırılan başka bir terime
 * işaret eder (Faz 4, bkz. docs/durum-denetim.md). `slug` yalnız karışan
 * terim SÖZLÜKTE de bir kayıtsa verilir — `getTerimBySlug` ile doğrulanır
 * (bkz. sozluk.test.ts), böylece kırık bir iç bağlantı sessizce kalmaz.
 * Karışan terim sözlükte yoksa (ör. "flanş") `slug` atlanır, yalnız düz
 * metin gösterilir.
 */
export interface KarisanTerim {
  terim: string;
  fark: string;
  slug?: string;
}

export interface Terim {
  /** Türkçe karşılık — listede birincil gösterim. */
  tr: string;
  /** İngilizce karşılık; sektörde İngilizce konuşulduğu için ikisi de verilir (docs/00 ilke 4). */
  en: string;
  /** Terimin ilk geçtiği konu hattı. */
  hat: string;
  /** Kısa tanım; soyut kavramlarda zihinsel model, örnek veya ayrım da içerebilir. */
  tanim: string;
  /** Yalnız en yüksek arama niyetli terimlerde var — bkz. KarisanTerim. */
  karisan?: KarisanTerim;
}

interface SozlukDosya {
  aciklama: string;
  terimler: Terim[];
}

const SOZLUK_PATH = path.join(process.cwd(), "content", "sozluk.json");

export const SOZLUK_FILE_PATH = SOZLUK_PATH;

/** Türkçe terimi okunabilir ve kalıcı bir URL parçasına dönüştürür. */
export function terimSlug(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Sözlük içeriği `content/sozluk.json` içinde veri olarak durur — kod değil.
 * Yeni terim eklemek dosyaya satır eklemektir (CLAUDE.md "içerik koddan ayrı").
 */
export function getSozluk(): Terim[] {
  const raw = fs.readFileSync(SOZLUK_PATH, "utf8");
  const parsed = JSON.parse(raw) as SozlukDosya;
  return [...parsed.terimler].sort((a, b) => a.tr.localeCompare(b.tr, "tr"));
}

export function getTerimBySlug(slug: string): Terim | undefined {
  return getSozluk().find((terim) => terimSlug(terim.tr) === slug);
}

/**
 * En yüksek arama niyetli 12 terim (Faz 4, bkz. docs/durum-denetim.md
 * "Sözlük/SEO derinleştirme"). Bu liste iki şey için kullanılır: hangi
 * terimlerin `karisan` alanı taşıdığı VE hangi terimlerin ders sayfalarından
 * geriye dönük bağlantı alacağı (bkz. `getSeoAnchorTermsInText`). Slug
 * olarak tutulur — `sozluk.test.ts` her birinin gerçekten `getSozluk()`te
 * bir karşılığı olduğunu doğrular.
 */
export const SEO_ANCHOR_TERM_SLUGS: readonly string[] = [
  "ters-kinematik",
  "ileri-kinematik",
  "tekillik",
  "manipulabilite",
  "jacobian-matrisi",
  "denavit-hartenberg-parametreleri",
  "serbestlik-derecesi",
  "konfigurasyon-uzayi",
  "calisma-uzayi",
  "el-goz-kalibrasyonu",
  "kamera-kalibrasyonu",
  "alet-merkez-noktasi",
];

/**
 * Bazı anchor terimler ders gövdesinde neredeyse hiç tam adıyla değil,
 * kısaltmasıyla geçiyor (ör. "Denavit-Hartenberg parametreleri" yerine
 * her yerde "DH parametreleri" yazılıyor — tam ad yalnız frontmatter
 * başlığında/kaynakçada geçiyor, gövdede değil). Bu, editoryal içeriğin
 * bir parçası değil saf bir eşleştirme detayı olduğu için `content/
 * sozluk.json`a değil buraya, koda ait.
 */
const ANCHOR_TERM_ALIASES: Record<string, readonly string[]> = {
  "denavit-hartenberg-parametreleri": ["dh parametreleri", "dh parametresi"],
};

/**
 * Bir metinde (ders gövdesi) GEÇEN en-yüksek-niyetli sözlük terimlerini
 * bulur — elle tutulan bir ders→terim eşlemesi değil, metnin kendisinden
 * türetilir (bkz. `lib/interactionManifest.ts`teki `extractUsedComponents`
 * ile aynı felsefe: elle girilen bir alan yanlış/eski olabilir, gerçek
 * kaynak metnin kendisidir). Basit alt dize eşleşmesi kullanır; Türkçe
 * ünsüz yumuşaması gibi çekim değişimlerini (tekillik → tekilliğe)
 * kaçırabilir, ama YANLIŞ POZİTİF üretmez — eksik bir geri bağlantı,
 * alakasız bir geri bağlantıdan daha güvenli bir başarısızlık biçimidir.
 * Dönen sıra `SEO_ANCHOR_TERM_SLUGS` sırasıyla aynıdır (kararlı gösterim).
 */
export function getSeoAnchorTermsInText(text: string): Terim[] {
  // Parantez içi kısaltmalar ("Denavit-Hartenberg (DH) parametreleri" gibi)
  // tam öbek eşleşmesini bozuyordu — parantezi boşlukla değiştirmek yalnız
  // RECALL'ı artırır, yanlış pozitif üretmez (terimin kendi sözcükleri hâlâ
  // sırayla aranıyor).
  const lowered = text
    .toLocaleLowerCase("tr-TR")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ");
  const sozluk = getSozluk();
  return SEO_ANCHOR_TERM_SLUGS
    .map((slug) => sozluk.find((terim) => terimSlug(terim.tr) === slug))
    .filter((terim): terim is Terim => {
      if (!terim) return false;
      const terimSlugu = terimSlug(terim.tr);
      const adaylar = [terim.tr.toLocaleLowerCase("tr-TR"), ...(ANCHOR_TERM_ALIASES[terimSlugu] ?? [])];
      return adaylar.some((aday) => lowered.includes(aday));
    });
}

/** Sözlüğü hatlara göre gruplar; hat sırası alfabetiktir (a-temeller … h-guvenlik). */
export function getSozlukByHat(): Array<{ hat: string; terimler: Terim[] }> {
  const gruplar = new Map<string, Terim[]>();
  for (const terim of getSozluk()) {
    const mevcut = gruplar.get(terim.hat) ?? [];
    mevcut.push(terim);
    gruplar.set(terim.hat, mevcut);
  }
  return [...gruplar.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "tr"))
    .map(([hat, terimler]) => ({ hat, terimler }));
}
