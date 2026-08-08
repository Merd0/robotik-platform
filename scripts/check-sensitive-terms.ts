import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");

// Bu liste yalnızca herkese açık adları içerir. İç proje kod adları gibi
// hassas değerler repoya yazılmaz; CI secret veya kurum içi taramada tutulur.
const PUBLIC_BUT_PROHIBITED_WORKPLACE_REFERENCES = ["ASELSAN", "MEOS"] as const;

function findMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findMdxFiles(fullPath);
    return entry.name.endsWith(".mdx") ? [fullPath] : [];
  });
}

const findings: string[] = [];
for (const filePath of findMdxFiles(CONTENT_DIR)) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const term of PUBLIC_BUT_PROHIBITED_WORKPLACE_REFERENCES) {
      if (line.toLocaleLowerCase("tr").includes(term.toLocaleLowerCase("tr"))) {
        findings.push(`${path.relative(process.cwd(), filePath)}:${index + 1} — yasaklı işyeri bağlamı: ${term}`);
      }
    }
  });
}

if (findings.length > 0) {
  console.error(`İşyeri/gizlilik kontrolü ${findings.length} bulgu üretti:\n${findings.map((item) => `  - ${item}`).join("\n")}`);
  process.exit(1);
}

console.log("İşyeri/gizlilik kontrolü temiz: ders içeriklerinde yasaklı bağlam bulunmadı.");
