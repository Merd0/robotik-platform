import { execFileSync } from "node:child_process";
import path from "node:path";
import matter from "gray-matter";
import type { DersFrontmatter } from "../lib/content";
import type { LessonInput } from "../lib/lessonArtifact";

/**
 * Git nesnelerinden ders okuma yardımcıları.
 *
 * Review makbuzu bir `sourceCommit` taşır. Bu alanın anlamlı olması için
 * "o commit gerçekten var mı ve o commit'teki ders bu makbuzun bağlandığı
 * hash'leri üretiyor mu" sorusunun cevaplanabilmesi gerekir. Yalnız 40 hex
 * karakter biçim kontrolü, uydurma ama biçimsel olarak geçerli bir değeri
 * kabul eder.
 *
 * Sığ (shallow) klonlarda commit nesnesi bulunmayabilir; o durumda çağıran
 * taraf doğrulamayı atlar ve bunu açıkça söyler — sessizce "geçti" demez.
 */
function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

export function isGitAvailable(): boolean {
  try {
    git(["rev-parse", "--git-dir"]);
    return true;
  } catch {
    return false;
  }
}

export function resolveCommit(ref: string): string | undefined {
  try {
    return git(["rev-parse", "--verify", `${ref}^{commit}`]).trim();
  } catch {
    return undefined;
  }
}

export function objectExists(ref: string): boolean {
  try {
    git(["cat-file", "-e", `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

/** Repo köküne göreli, ileri eğik çizgili yol — git bunu bekler. */
export function toRepoRelativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join("/");
}

export function readFileAtCommit(commit: string, repoRelativePath: string): string | undefined {
  try {
    return git(["show", `${commit}:${repoRelativePath}`]);
  } catch {
    return undefined;
  }
}

export function readLessonAtCommit(commit: string, filePath: string): LessonInput | undefined {
  const raw = readFileAtCommit(commit, toRepoRelativePath(filePath));
  if (raw === undefined) return undefined;
  const { data, content } = matter(raw);
  return { frontmatter: data as DersFrontmatter, body: content };
}

export function hasUncommittedChanges(filePath: string): boolean {
  try {
    return git(["status", "--porcelain", "--", toRepoRelativePath(filePath)]).trim().length > 0;
  } catch {
    return false;
  }
}
