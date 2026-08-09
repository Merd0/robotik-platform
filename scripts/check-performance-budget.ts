import fs from "node:fs";
import path from "node:path";

const out = path.resolve("out");
const htmlPath = path.join(out, "index.html");
if (!fs.existsSync(htmlPath)) throw new Error("out/index.html yok; önce npm run build çalıştırın.");

const html = fs.readFileSync(htmlPath, "utf8");
const localAssets = (pattern: RegExp) => [...html.matchAll(pattern)].map((match) => match[1]).filter((url) => url.startsWith("/"));
const scripts = [...new Set(localAssets(/<script[^>]+src="([^"]+)"/g))];
const styles = [...new Set(localAssets(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g))];
const size = (asset: string) => fs.statSync(path.join(out, asset.replace(/^\//, ""))).size;

const measurements = {
  htmlBytes: fs.statSync(htmlPath).size,
  initialScriptBytes: scripts.reduce((total, asset) => total + size(asset), 0),
  initialStyleBytes: styles.reduce((total, asset) => total + size(asset), 0),
};
const budgets = { htmlBytes: 50_000, initialScriptBytes: 650_000, initialStyleBytes: 100_000 };
const failures = Object.entries(budgets).filter(([key, budget]) => measurements[key as keyof typeof measurements] > budget);

console.log("Ana sayfa sıkıştırılmamış başlangıç bütçesi:", measurements);
if (failures.length > 0) {
  for (const [key, budget] of failures) console.error(`${key}: ${measurements[key as keyof typeof measurements]} > ${budget}`);
  process.exit(1);
}

const initialUrls = [...scripts, ...styles].join("\n");
if (initialUrls.includes("pyodide") || initialUrls.includes("worker")) {
  console.error("Ağır Pyodide/worker varlığı ana sayfa başlangıç grafiğine sızdı.");
  process.exit(1);
}
