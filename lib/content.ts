import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Seviye = "ortaokul" | "lise" | "universite";
export type DersDurum = "taslak" | "inceleme" | "yayinda";

/**
 * Ders sayfasının SUNUM şablonu — docs/04'teki 6 bölümlük içerik (Kanca/
 * Sahne/Ne oldu/Gerçek dünyada/Dene/Sonraki) hiçbir şablonda değişmez;
 * değişen yalnız bu bölümlerin render sırası/çerçevesi. bkz. docs/16
 * madde 7, docs/durum-denetim.md "Faz 1" taksonomi analizi.
 *
 * - "kesif": varsayılan, mevcut doğrusal sıra (tek sahne, tahmin/görev yok).
 * - "gorev": Dene'deki görev tanımı Kanca'nın hemen ardına alınır (tahmin
 *   ve/veya meydan okuma önce, değerlendirme sahneden sonra).
 * - "karsilastirma": Sahne çoklu/yan yana, Ne oldu açık karşılaştırma
 *   çerçevesinde yazılır.
 * - "kod-lab": Kanca bir kodlama görevi, Ne oldu kodun/robotun izini sürer.
 * - "referans": Sahne yok; metin-temelli karşılaştırma yerleşimi.
 */
export type LessonSablon = "kesif" | "gorev" | "karsilastirma" | "kod-lab" | "referans";
export const DEFAULT_LESSON_SABLON: LessonSablon = "kesif";

export type SourceKind = "official-doc" | "software-doc" | "book" | "paper" | "standard" | "dataset" | "other";

export interface SourceRef {
  kind: SourceKind;
  title: string;
  url?: string;
  publisher?: string;
  version?: string;
  accessedAt?: string;
}

const SEVIYE_ORDER: Seviye[] = ["ortaokul", "lise", "universite"];
export const SEVIYE_ETIKET: Record<Seviye, string> = {
  ortaokul: "Ortaokul",
  lise: "Lise",
  universite: "Üniversite",
};

/** Konu hattı klasör adı → görünen ad. Yeni hat eklenirse buraya bir satır eklenir. */
export const HAT_ETIKET: Record<string, string> = {
  "a-temeller": "Temeller",
  "b-kinematik": "Hareket ve kinematik",
  "c-planlama": "Yol planlama",
  "d-programlama": "Robot programlama dilleri",
  "e-haberlesme": "Haberleşme ve entegrasyon",
  "f-algilama": "Algılama: sensör ve görü",
  "g-simulasyon": "Simülasyon ve dijital ikiz",
  "h-guvenlik": "Güvenlik ve endüstriyel gerçeklik",
};

/** Etiketi bilinmeyen hat için klasör adını olduğu gibi döndürür. */
export function hatEtiket(hat: string): string {
  return HAT_ETIKET[hat] ?? hat;
}

export interface DersFrontmatter {
  id: string;
  baslik: string;
  hat: string;
  seviye: Seviye;
  sure: number;
  /** Aynı hat + seviye içindeki öğretim sırası. Belirtilmezse 0 kabul edilir. */
  sira?: number;
  onkosul: string[];
  kazanimlar: string[];
  /** Legacy metin kaynaklar okunabilir kalır; yeni yayınlar yapılandırılmış SourceRef kullanır. */
  kaynaklar: Array<string | SourceRef>;
  etkilesimli: string[];
  durum: DersDurum;
  incelendi_tarafindan?: string;
  incelendi_tarih?: string;
  /** Belirtilmezse DEFAULT_LESSON_SABLON ("kesif") varsayılır. */
  sablon?: LessonSablon;
}

export const LESSON_SABLON_DEGERLERI: readonly LessonSablon[] = ["kesif", "gorev", "karsilastirma", "kod-lab", "referans"];

/** Frontmatter'daki `sablon` her zaman geçerli bir değere düşer — bilinmeyen/eksik değer sessizce "kesif"e döner. */
export function resolveLessonSablon(sablon: string | undefined): LessonSablon {
  return LESSON_SABLON_DEGERLERI.includes(sablon as LessonSablon) ? (sablon as LessonSablon) : DEFAULT_LESSON_SABLON;
}

export interface Lesson {
  slug: string;
  filePath: string;
  frontmatter: DersFrontmatter;
  body: string;
}

interface LessonIndex {
  lessons: readonly Lesson[];
  bySlug: ReadonlyMap<string, Lesson>;
  byLevel: ReadonlyMap<Seviye, readonly Lesson[]>;
  byTrack: ReadonlyMap<string, readonly Lesson[]>;
  byTrackAndLevel: ReadonlyMap<string, readonly Lesson[]>;
}

interface LessonCatalog {
  signature: string;
  all: LessonIndex;
  published: LessonIndex;
}

let catalogCache: LessonCatalog | null = null;

function findMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findMdxFiles(fullPath);
    return entry.name.endsWith(".mdx") ? [fullPath] : [];
  });
}

function trackAndLevelKey(hat: string, seviye: Seviye): string {
  return `${hat}::${seviye}`;
}

function createIndex(lessons: readonly Lesson[]): LessonIndex {
  const bySlug = new Map<string, Lesson>();
  const byLevel = new Map<Seviye, Lesson[]>();
  const byTrack = new Map<string, Lesson[]>();
  const byTrackAndLevel = new Map<string, Lesson[]>();

  for (const lesson of lessons) {
    bySlug.set(lesson.slug, lesson);
    const { hat, seviye } = lesson.frontmatter;
    byLevel.set(seviye, [...(byLevel.get(seviye) ?? []), lesson]);
    byTrack.set(hat, [...(byTrack.get(hat) ?? []), lesson]);
    const key = trackAndLevelKey(hat, seviye);
    byTrackAndLevel.set(key, [...(byTrackAndLevel.get(key) ?? []), lesson]);
  }

  const lessonOrder = (a: Lesson, b: Lesson) => (a.frontmatter.sira ?? 0) - (b.frontmatter.sira ?? 0);
  for (const lessonsAtLevel of byLevel.values()) lessonsAtLevel.sort(lessonOrder);
  for (const lessonsInTrack of byTrack.values()) {
    lessonsInTrack.sort((a, b) => {
      const levelDifference = SEVIYE_ORDER.indexOf(a.frontmatter.seviye) - SEVIYE_ORDER.indexOf(b.frontmatter.seviye);
      return levelDifference || lessonOrder(a, b);
    });
  }
  for (const lessonsInTrackLevel of byTrackAndLevel.values()) lessonsInTrackLevel.sort(lessonOrder);

  return { lessons, bySlug, byLevel, byTrack, byTrackAndLevel };
}

function contentSignature(files: readonly string[]): string {
  return files
    .map((filePath) => {
      const stat = fs.statSync(filePath);
      return `${filePath}:${stat.size}:${stat.mtimeMs}`;
    })
    .join("|");
}

function loadCatalog(files: readonly string[], signature: string): LessonCatalog {
  const lessons = files.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const frontmatter = data as DersFrontmatter;
    return { slug: frontmatter.id, filePath, frontmatter, body: content };
  });

  return {
    signature,
    all: createIndex(lessons),
    published: createIndex(lessons.filter((lesson) => lesson.frontmatter.durum === "yayinda")),
  };
}

/**
 * Bir process/build boyunca tek katalog. Production build'de ilk okumadan
 * sonra dosya sistemine yeniden dokunmaz. Geliştirmede dosya imzasını (yol,
 * boyut, mtime) denetler; MDX eklenir, silinir veya değişirse yeniden kurar.
 */
function getCatalog(): LessonCatalog {
  if (catalogCache && process.env.NODE_ENV === "production") return catalogCache;

  const files = findMdxFiles(CONTENT_DIR).sort((a, b) => a.localeCompare(b));
  const signature = contentSignature(files);
  if (!catalogCache || catalogCache.signature !== signature) {
    catalogCache = loadCatalog(files, signature);
  }
  return catalogCache;
}

function getPublicIndex(): LessonIndex {
  const catalog = getCatalog();
  return taslakOnizlemeAcik() ? catalog.all : catalog.published;
}

export function getAllLessons(): Lesson[] {
  return [...getCatalog().all.lessons];
}

/**
 * İçerik durumu açıkça `yayinda` olarak işaretlenmiş dersler.
 *
 * Bu küme ortamdan bağımsızdır: taslak önizlemesi açıkken bile taslak veya
 * incelemedeki dersleri içermez. Sitemap gibi herkese açık dağıtım çıktıları
 * bu fonksiyona dayanmalıdır.
 */
export function getPublishedLessons(): Lesson[] {
  return [...getCatalog().published.lessons];
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return getCatalog().all.bySlug.get(slug);
}

/**
 * Taslak derslerin önizlenmesi açık mı?
 *
 * Yayınlanmış üretim sitesinde KAPALI olmalı: `durum: yayinda` olmayan bir
 * ders herkese açık adreste hiç var olmamalı. Bu insan incelemesi göstergesi
 * değildir; yalnız editoryal yayın durumunun teknik karşılığıdır. Özellikle
 * Hat H dahil hiçbir taslak, listelenmese bile URL'i bilinen bir sayfa olarak
 * üretim çıktısına sızmamalı.
 *
 * Geliştirme sırasında AÇIK: yazarken dersi tarayıcıda görebilmek gerekiyor.
 * `ICERIK_TASLAK_ONIZLEME=1` ile bilinçli olarak bir önizleme derlemesi de
 * yapılabilir — ama o derlemede taslak sayfalar `noindex` alır.
 */
export function taslakOnizlemeAcik(): boolean {
  if (process.env.ICERIK_TASLAK_ONIZLEME === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/**
 * Herkese açık olarak sunulabilecek dersler. Üretimde yalnızca
 * `durum: yayinda` olanlar; geliştirme/önizleme derlemesinde hepsi.
 *
 * Sayfa üretimi (`generateStaticParams`) ve tekil ders erişimi bu fonksiyona
 * dayanır — böylece "listede görünmüyor ama URL çalışıyor" durumu oluşamaz.
 */
export function getPublicLessons(): Lesson[] {
  return [...getPublicIndex().lessons];
}

/** Slug herkese açık mı — değilse ders sayfası 404 vermeli. */
export function getPublicLessonBySlug(slug: string): Lesson | undefined {
  return getPublicIndex().bySlug.get(slug);
}

export function getLessonsByLevel(seviye: Seviye): Lesson[] {
  return [...(getCatalog().all.byLevel.get(seviye) ?? [])];
}

/** Yayın/önizleme kuralını koruyarak bir seviyedeki dersleri hat ve sıra düzeninde döndürür. */
export function getPublicLessonsByLevel(seviye: Seviye): Lesson[] {
  const hatSirasi = Object.keys(HAT_ETIKET);
  return [...(getPublicIndex().byLevel.get(seviye) ?? [])]
    .sort((a, b) => {
      const hatFarki = hatSirasi.indexOf(a.frontmatter.hat) - hatSirasi.indexOf(b.frontmatter.hat);
      return hatFarki || (a.frontmatter.sira ?? 0) - (b.frontmatter.sira ?? 0);
    });
}

export function getPublicTracksByLevel(seviye: Seviye): { hat: string; lessons: Lesson[] }[] {
  const lessons = getPublicLessonsByLevel(seviye);
  return Object.keys(HAT_ETIKET)
    .map((hat) => ({ hat, lessons: lessons.filter((lesson) => lesson.frontmatter.hat === hat) }))
    .filter((group) => group.lessons.length > 0);
}

/**
 * Aynı hat + seviye içindeki dersler, öğretim sırasına göre.
 * Yalnızca herkese açık dersleri döndürür — aksi hâlde yayınlanmış bir ders,
 * üretimde 404 verecek bir taslak derse "sonraki" bağlantısı verirdi.
 */
export function getOrderedLessons(hat: string, seviye: Seviye): Lesson[] {
  return [...(getPublicIndex().byTrackAndLevel.get(trackAndLevelKey(hat, seviye)) ?? [])];
}

/** Sözlük ve benzeri herkese açık yüzeyler için bir hattaki yayınlanmış dersler. */
export function getPublishedLessonsByTrack(hat: string): Lesson[] {
  return [...(getCatalog().published.byTrack.get(hat) ?? [])];
}

/** Ön koşullar — yine yalnızca herkese açık dersler (kırık bağlantı olmasın). */
export function getPrerequisites(lesson: Lesson): Lesson[] {
  const bySlug = getPublicIndex().bySlug;
  return lesson.frontmatter.onkosul
    .map((id) => bySlug.get(id))
    .filter((candidate): candidate is Lesson => candidate !== undefined);
}

/**
 * Aynı hat içinde bir önceki/sonraki ders. Seviyenin son dersindeyse bir üst
 * seviyenin ilk dersine, ilk dersindeyse bir alt seviyenin son dersine
 * atlar — bkz. docs/01-mufredat.md "ders yapısı: sonraki adım".
 */
export function getAdjacentLessons(lesson: Lesson): { previous: Lesson | null; next: Lesson | null } {
  const { hat, seviye } = lesson.frontmatter;
  const sameTrack = getOrderedLessons(hat, seviye);
  const index = sameTrack.findIndex((candidate) => candidate.slug === lesson.slug);
  const seviyeIndex = SEVIYE_ORDER.indexOf(seviye);

  let previous = index > 0 ? sameTrack[index - 1] : null;
  if (!previous && seviyeIndex > 0) {
    const lowerTrack = getOrderedLessons(hat, SEVIYE_ORDER[seviyeIndex - 1]);
    previous = lowerTrack.length > 0 ? lowerTrack[lowerTrack.length - 1] : null;
  }

  let next = index < sameTrack.length - 1 ? sameTrack[index + 1] : null;
  if (!next && seviyeIndex < SEVIYE_ORDER.length - 1) {
    const higherTrack = getOrderedLessons(hat, SEVIYE_ORDER[seviyeIndex + 1]);
    next = higherTrack.length > 0 ? higherTrack[0] : null;
  }

  return { previous, next };
}
