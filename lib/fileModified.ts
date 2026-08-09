import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const cache = new Map<string, Date>();

/**
 * Bir kaynak dosyasının son gerçek değişiklik zamanını Git geçmişinden okur.
 * `.git` bulunmayan paketlenmiş derlemelerde dosya sistemi mtime'ına düşer.
 */
export function getFileLastModified(filePath: string): Date {
  const absolutePath = path.resolve(filePath);
  const cached = cache.get(absolutePath);
  if (cached) return new Date(cached);

  const relativePath = path.relative(process.cwd(), absolutePath).replaceAll(path.sep, "/");
  let modified: Date | undefined;

  try {
    const output = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", relativePath],
      { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    const gitDate = new Date(output);
    if (output && !Number.isNaN(gitDate.getTime())) modified = gitDate;
  } catch {
    // Statik export bir Git checkout'u dışında da çalışabilsin.
  }

  modified ??= fs.statSync(absolutePath).mtime;
  cache.set(absolutePath, modified);
  return new Date(modified);
}
