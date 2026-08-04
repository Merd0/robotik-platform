import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Seviye = "ortaokul" | "lise" | "universite";
export type DersDurum = "taslak" | "inceleme" | "yayinda";

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
  kaynaklar: string[];
  etkilesimli: string[];
  durum: DersDurum;
  incelendi_tarafindan?: string;
  incelendi_tarih?: string;
}

export interface Lesson {
  slug: string;
  filePath: string;
  frontmatter: DersFrontmatter;
  body: string;
}

function findMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findMdxFiles(fullPath);
    return entry.name.endsWith(".mdx") ? [fullPath] : [];
  });
}

export function getAllLessons(): Lesson[] {
  return findMdxFiles(CONTENT_DIR).map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const frontmatter = data as DersFrontmatter;
    return { slug: frontmatter.id, filePath, frontmatter, body: content };
  });
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return getAllLessons().find((lesson) => lesson.slug === slug);
}

export function getLessonsByLevel(seviye: Seviye): Lesson[] {
  return getAllLessons()
    .filter((lesson) => lesson.frontmatter.seviye === seviye)
    .sort((a, b) => (a.frontmatter.sira ?? 0) - (b.frontmatter.sira ?? 0));
}

/** Aynı hat + seviye içindeki dersler, öğretim sırasına göre. */
export function getOrderedLessons(hat: string, seviye: Seviye): Lesson[] {
  return getAllLessons()
    .filter((lesson) => lesson.frontmatter.hat === hat && lesson.frontmatter.seviye === seviye)
    .sort((a, b) => (a.frontmatter.sira ?? 0) - (b.frontmatter.sira ?? 0));
}

export function getPrerequisites(lesson: Lesson): Lesson[] {
  const allLessons = getAllLessons();
  return lesson.frontmatter.onkosul
    .map((id) => allLessons.find((candidate) => candidate.slug === id))
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
