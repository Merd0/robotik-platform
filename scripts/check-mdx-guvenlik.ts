import fs from "node:fs";
import path from "node:path";
import { mdxDenetle } from "../lib/mdxGuvenlik";

/**
 * `content/` altındaki tüm MDX dosyalarını AST allowlist'ine karşı denetler.
 * Kural ve gerekçe: lib/mdxGuvenlik.ts başlığı.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

function mdxDosyalari(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const tam = path.join(dir, entry.name);
    if (entry.isDirectory()) return mdxDosyalari(tam);
    return entry.name.endsWith(".mdx") ? [tam] : [];
  });
}

function main(): void {
  const dosyalar = mdxDosyalari(CONTENT_DIR);
  const bulgular = dosyalar.flatMap((dosya) =>
    mdxDenetle(fs.readFileSync(dosya, "utf8"), path.relative(process.cwd(), dosya)),
  );

  if (bulgular.length > 0) {
    console.error(`MDX güvenlik denetimi ${bulgular.length} bulgu buldu:\n`);
    for (const b of bulgular) {
      console.error(`  ${b.dosya}${b.satir ? `:${b.satir}` : ""} — ${b.mesaj}`);
    }
    console.error(
      "\nDers içeriği yalnızca izinli bileşenleri ve saf veri prop'larını kullanabilir " +
        "(bkz. docs/08-guvenlik-sertlestirme.md).",
    );
    process.exit(1);
  }

  console.log(`MDX güvenlik denetimi temiz: ${dosyalar.length} ders dosyası.`);
}

main();
