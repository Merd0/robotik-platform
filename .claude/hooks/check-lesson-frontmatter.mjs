import fs from "node:fs";
import matter from "gray-matter";

/**
 * "durum: yayinda" kapisi.
 *
 * Tek sart kaldi: kaynaklar alani dolu olmali. Bu bir gizlilik ve telif
 * korumasidir (docs/00-vizyon.md) — kaynagi gosterilemeyen bilgi yayinlanmaz.
 *
 * INSAN INCELEMESI SARTI KALDIRILDI (2026-08-10, kalici proje karari; bkz.
 * docs/06-kalite-ve-topluluk.md "Katman 3"). Bu hook artik ne Review Receipt
 * ne de legacy incelendi_* alani arar. Makbuz sistemi calisir durumda ve
 * `npm run review` ile isteyen kullanabilir, ama yayin icin zorunlu degildir.
 *
 * Bu dosya .claude/, .agents/ ve .codex/ altinda ayni icerikle tutulur
 * (docs/09 bolum 1.4 — otomatik senkron yok, elle guncellenir).
 */

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

const raw = await readStdin();

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const toolName = payload.tool_name;
const input = payload.tool_input ?? {};
const filePath = input.file_path;

if (!filePath || !["Edit", "Write"].includes(toolName)) process.exit(0);

const normalized = filePath.replace(/\\/g, "/");
const isContentFile =
  (normalized.includes("/content/") || normalized.startsWith("content/")) && normalized.endsWith(".mdx");
if (!isContentFile) process.exit(0);

let resultingContent;
if (toolName === "Write") {
  resultingContent = input.content ?? "";
} else {
  let current = "";
  try {
    current = fs.readFileSync(filePath, "utf8");
  } catch {
    current = "";
  }
  const oldStr = input.old_string ?? "";
  const newStr = input.new_string ?? "";
  resultingContent = current.includes(oldStr) ? current.replace(oldStr, newStr) : current + newStr;
}

let frontmatter;
try {
  frontmatter = matter(resultingContent).data;
} catch {
  process.exit(0);
}

if (frontmatter.durum !== "yayinda") process.exit(0);

const errors = [];
if (!Array.isArray(frontmatter.kaynaklar) || frontmatter.kaynaklar.length === 0) {
  errors.push('"kaynaklar" alani bos olamaz (durum: yayinda icin zorunlu).');
}

if (errors.length > 0) {
  console.error(`Bu ders "durum: yayinda" olarak kaydedilemez:\n- ${errors.join("\n- ")}`);
  process.exit(2);
}

process.exit(0);
