import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Seviye = "ortaokul" | "lise" | "universite";
export type DersDurum = "taslak" | "inceleme" | "yayinda";

export interface DersFrontmatter {
  id: string;
  baslik: string;
  hat: string;
  seviye: Seviye;
  sure: number;
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
