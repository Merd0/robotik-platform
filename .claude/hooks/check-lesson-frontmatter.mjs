import fs from "node:fs";
import matter from "gray-matter";

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
if (!frontmatter.incelendi_tarafindan) {
  errors.push('"incelendi_tarafindan" alani bos olamaz (durum: yayinda icin zorunlu).');
}
if (!frontmatter.incelendi_tarih) {
  errors.push('"incelendi_tarih" alani bos olamaz (durum: yayinda icin zorunlu).');
}

if (errors.length > 0) {
  console.error(`Bu ders "durum: yayinda" olarak kaydedilemez:\n- ${errors.join("\n- ")}`);
  process.exit(2);
}

process.exit(0);
