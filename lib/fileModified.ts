import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const cache = new Map<string, Date>();

/**
 * Depo geçmişinden yol → son commit tarihi eşlemesi, TEK git çağrısıyla.
 *
 * Önceden her dosya için ayrı bir `git log` süreci açılıyordu. 39 yayınla bu
 * fark edilmiyordu; 2026-08-10'da 89 derse çıkınca sitemap üretimi 89 alt
 * süreç açar hale geldi ve Windows'ta sitemap testi 5 sn sınırını aştı.
 * `--name-only` ile tek geçişte tüm yolları okumak aynı sonucu veriyor.
 *
 * `git log` ters kronolojik olduğu için bir yolun İLK görüldüğü tarih onun en
 * son değişiklik tarihidir.
 */
let historyIndex: Map<string, Date> | undefined;

function loadHistoryIndex(): Map<string, Date> {
  if (historyIndex) return historyIndex;
  const index = new Map<string, Date>();

  try {
    const output = execFileSync("git", ["log", "--format=%cI", "--name-only", "--no-renames"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });

    let current: Date | undefined;
    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const asDate = new Date(trimmed);
      if (trimmed.length >= 20 && !Number.isNaN(asDate.getTime()) && trimmed.includes("T")) {
        current = asDate;
        continue;
      }
      if (current && !index.has(trimmed)) index.set(trimmed, current);
    }
  } catch {
    // Git yoksa (paketlenmiş derleme) boş kalır; mtime'a düşülür.
  }

  historyIndex = index;
  return index;
}

/**
 * Bir kaynak dosyasının son gerçek değişiklik zamanını Git geçmişinden okur.
 * `.git` bulunmayan paketlenmiş derlemelerde dosya sistemi mtime'ına düşer.
 */
export function getFileLastModified(filePath: string): Date {
  const absolutePath = path.resolve(filePath);
  const cached = cache.get(absolutePath);
  if (cached) return new Date(cached);

  const relativePath = path.relative(process.cwd(), absolutePath).replaceAll(path.sep, "/");
  let modified = loadHistoryIndex().get(relativePath);

  modified ??= fs.statSync(absolutePath).mtime;
  cache.set(absolutePath, modified);
  return new Date(modified);
}
