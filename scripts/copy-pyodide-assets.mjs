import fs from "node:fs";
import path from "node:path";

/**
 * Pyodide'in çekirdek dağıtım dosyalarını node_modules/pyodide'den
 * public/pyodide/ altına kopyalar — kendi alan adımızdan sunulsun diye
 * (bkz. docs/08-guvenlik-sertlestirme.md "harici CDN yasak"). Ekstra
 * bilimsel paketler (numpy vb.) BİLİNÇLİ OLARAK kopyalanmıyor: bu
 * platformdaki Python dersleri saf dil + stdlib kullanıyor, ekstra
 * paket gerekmiyor. Biri denerse import başarısız olur (404) — sessizce
 * dış bir CDN'e düşmez, çünkü indexURL kendi alan adımızı gösteriyor.
 */

const SOURCE_DIR = path.join(process.cwd(), "node_modules", "pyodide");
const TARGET_DIR = path.join(process.cwd(), "public", "pyodide");

const CORE_FILES = [
  "pyodide.mjs",
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

fs.mkdirSync(TARGET_DIR, { recursive: true });

for (const file of CORE_FILES) {
  fs.copyFileSync(path.join(SOURCE_DIR, file), path.join(TARGET_DIR, file));
}

console.log(`${CORE_FILES.length} Pyodide çekirdek dosyası public/pyodide/ altına kopyalandı.`);
