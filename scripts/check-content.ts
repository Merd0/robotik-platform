import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");
const REQUIRED_FIELDS = ["id", "baslik", "hat", "seviye", "sure"] as const;

function findMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findMdxFiles(fullPath);
    return entry.name.endsWith(".mdx") ? [fullPath] : [];
  });
}

function checkFile(filePath: string): string[] {
  const errors: string[] = [];
  const relativePath = path.relative(process.cwd(), filePath);
  const { data } = matter(fs.readFileSync(filePath, "utf8"));

  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      errors.push(`${relativePath}: "${field}" alanı eksik.`);
    }
  }

  if (!Array.isArray(data.kaynaklar) || data.kaynaklar.length === 0) {
    errors.push(
      `${relativePath}: "kaynaklar" alanı boş olamaz (gizlilik koruması, bkz. docs/00-vizyon.md).`,
    );
  }

  if (data.durum === "yayinda") {
    if (!data.incelendi_tarafindan) {
      errors.push(`${relativePath}: durum: yayinda için "incelendi_tarafindan" dolu olmalı.`);
    }
    if (!data.incelendi_tarih) {
      errors.push(`${relativePath}: durum: yayinda için "incelendi_tarih" dolu olmalı.`);
    }
  }

  return errors;
}

function main() {
  const files = findMdxFiles(CONTENT_DIR);
  if (files.length === 0) {
    console.log("content/ altında henüz .mdx dosyası yok.");
    return;
  }

  const allErrors = files.flatMap(checkFile);
  const ids = new Map<string, string[]>();
  for (const filePath of files) {
    const { data } = matter(fs.readFileSync(filePath, "utf8"));
    if (typeof data.id === "string") {
      const existing = ids.get(data.id) ?? [];
      existing.push(path.relative(process.cwd(), filePath));
      ids.set(data.id, existing);
    }
  }
  for (const [id, paths] of ids) {
    if (paths.length > 1) {
      allErrors.push(`id "${id}" birden fazla dosyada kullanılıyor: ${paths.join(", ")}`);
    }
  }

  if (allErrors.length > 0) {
    console.error(`${allErrors.length} hata bulundu:\n`);
    allErrors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log(`${files.length} ders dosyası kontrol edildi, hata yok.`);
}

main();
