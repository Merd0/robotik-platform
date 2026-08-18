import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { KodAkademisiAsama } from "./kodAkademisiArtifact";

/**
 * Kod Akademisi içerik yükleyicisi.
 *
 * `lib/content.ts`'teki ders kataloğuyla AYNI dizini paylaşmaz —
 * `content-kod-akademisi/` bilinçli olarak `content/` dışında (bkz.
 * docs/durum-codex.md "Kod Akademisi — mimari teklif"): `lib/content.ts`
 * `content/` altındaki HER `.mdx`'i `DersFrontmatter` olarak okuyup
 * `hat`/`seviye` alanlarına göre indeksliyor; bu alanları olmayan bir modül
 * oraya konsaydı katalog `undefined` anahtarlı hayalet kayıtlarla kirlenirdi.
 *
 * Aşama içi sıralama DOĞRUSAL — ders sistemindeki `onkosul` graph'ı yok,
 * çünkü modül N, N-1'i gerektirir varsayımı yeterli (bkz. vizyon dokümanı).
 */

const CONTENT_DIR = path.join(process.cwd(), "content-kod-akademisi");
export const KOD_AKADEMISI_ASAMALAR: readonly KodAkademisiAsama[] = ["temel", "orta", "ileri", "usta"] as const;
export const ASAMA_ETIKET: Record<KodAkademisiAsama, string> = {
  temel: "Temel",
  orta: "Orta",
  ileri: "İleri",
  usta: "Usta",
};

export type KodAkademisiDurum = "taslak" | "yayinda";

export interface KodAkademisiModuleFrontmatter {
  id: string;
  baslik: string;
  asama: KodAkademisiAsama;
  sira: number;
  kazanimlar: string[];
  ipuclari: string[];
  cozum: string;
  /** CodeRunner'a verilen başlangıç kodu — tek kaynak burası, MDX gövdesinde tekrar edilmez. */
  initialCode: string;
  robot: string;
  skillId: string;
  /** Verilirse modül davranışsal olarak değerlendirilir (Değiştir/Tamamla/Yaz); yoksa Gözlem tipi — çalıştırmak yeterli. */
  expectedFinalDegrees?: number[];
  toleranceDegrees?: number;
  durum: KodAkademisiDurum;
}

export interface KodAkademisiModule {
  slug: string;
  filePath: string;
  frontmatter: KodAkademisiModuleFrontmatter;
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

function loadModules(): KodAkademisiModule[] {
  return findMdxFiles(CONTENT_DIR)
    .sort((a, b) => a.localeCompare(b))
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(raw);
      const frontmatter = data as KodAkademisiModuleFrontmatter;
      return { slug: frontmatter.id, filePath, frontmatter, body: content };
    });
}

let cache: KodAkademisiModule[] | null = null;

function getCatalog(): KodAkademisiModule[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  cache = loadModules();
  return cache;
}

function isPublicModule(module: KodAkademisiModule): boolean {
  if (module.frontmatter.durum === "yayinda") return true;
  return process.env.ICERIK_TASLAK_ONIZLEME === "1" || process.env.NODE_ENV !== "production";
}

export function getPublicModules(): KodAkademisiModule[] {
  return getCatalog().filter(isPublicModule);
}

export function getPublicModuleBySlug(slug: string): KodAkademisiModule | undefined {
  return getPublicModules().find((module) => module.slug === slug);
}

/** Bir aşamadaki modüller, aşama içi sıraya göre. */
export function getPublicModulesByAsama(asama: KodAkademisiAsama): KodAkademisiModule[] {
  return getPublicModules()
    .filter((module) => module.frontmatter.asama === asama)
    .sort((a, b) => a.frontmatter.sira - b.frontmatter.sira);
}

/** Aynı aşama içinde bir önceki/sonraki modül — ders sistemindeki `getAdjacentLessons` ile aynı fikir, graph yok. */
export function getAdjacentModules(module: KodAkademisiModule): { previous: KodAkademisiModule | null; next: KodAkademisiModule | null } {
  const siradaki = getPublicModulesByAsama(module.frontmatter.asama);
  const index = siradaki.findIndex((candidate) => candidate.slug === module.slug);
  return {
    previous: index > 0 ? siradaki[index - 1] : null,
    next: index >= 0 && index < siradaki.length - 1 ? siradaki[index + 1] : null,
  };
}
