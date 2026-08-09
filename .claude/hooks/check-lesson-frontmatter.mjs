import fs from "node:fs";
import matter from "gray-matter";

/**
 * "durum: yayinda" kapisi.
 *
 * Iki katman:
 *  1. kaynaklar alani her zaman dolu olmali (gizlilik korumasi, docs/00).
 *  2. insan incelemesi kaniti. Bu kanit iki kaynaktan gelebilir:
 *     - Dondurulmus legacy baseline'daki 39 ders icin eski frontmatter
 *       alanlari (incelendi_tarafindan / incelendi_tarih).
 *     - Bunun disindaki her ders icin Review Receipt v2. Legacy alan yeni
 *       yayinlara dayatilmaz; proje o alanin tek basina kanit olmadigina
 *       zaten karar verdi (docs/06 "Surume bagli inceleme kaydi").
 *
 * Bu dosya .claude/, .agents/ ve .codex/ altinda ayni icerikle tutulur
 * (docs/09 bolum 1.4 — otomatik senkron yok, elle guncellenir).
 */

const CONTENT_PATHS = {
  debt: new URL("../../content/review-debt.json", import.meta.url),
  receipts: new URL("../../content/review-receipts.json", import.meta.url),
};

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

function readJson(url) {
  try {
    return JSON.parse(fs.readFileSync(url, "utf8"));
  } catch {
    return undefined;
  }
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

const debt = readJson(CONTENT_PATHS.debt);
const baselineIds = Array.isArray(debt?.baselineIds) ? debt.baselineIds : undefined;

if (!baselineIds) {
  // Baseline okunamadiysa hangi kuralin gecerli oldugu bilinemez. Sessizce
  // gevsetmek yerine acikca durdur.
  errors.push("content/review-debt.json okunamadi; legacy baseline dogrulanamiyor.");
} else if (baselineIds.includes(frontmatter.id)) {
  if (!frontmatter.incelendi_tarafindan) {
    errors.push('"incelendi_tarafindan" alani bos olamaz (legacy baseline dersi).');
  }
  if (!frontmatter.incelendi_tarih) {
    errors.push('"incelendi_tarih" alani bos olamaz (legacy baseline dersi).');
  }
} else {
  const receipts = readJson(CONTENT_PATHS.receipts)?.receipts;
  const hasApproved =
    Array.isArray(receipts) &&
    receipts.some((receipt) => receipt?.lessonId === frontmatter.id && receipt?.decision === "approved");
  if (!hasApproved) {
    errors.push(
      `"${frontmatter.id}" icin onaylanmis Review Receipt yok. Yayin kararini elle degil su komutla ver:\n` +
        `    npm run review onayla ${frontmatter.id} --kapsam hepsi --kim "Ad Soyad" --yayinla`,
    );
  }
}

if (errors.length > 0) {
  console.error(`Bu ders "durum: yayinda" olarak kaydedilemez:\n- ${errors.join("\n- ")}`);
  process.exit(2);
}

process.exit(0);
