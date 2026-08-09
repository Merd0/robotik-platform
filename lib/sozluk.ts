import fs from "node:fs";
import path from "node:path";

export interface Terim {
  /** Türkçe karşılık — listede birincil gösterim. */
  tr: string;
  /** İngilizce karşılık; sektörde İngilizce konuşulduğu için ikisi de verilir (docs/00 ilke 4). */
  en: string;
  /** Terimin ilk geçtiği konu hattı. */
  hat: string;
  /** Kısa tanım; soyut kavramlarda zihinsel model, örnek veya ayrım da içerebilir. */
  tanim: string;
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
