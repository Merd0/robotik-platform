import fs from "node:fs";
import path from "node:path";

/**
 * Ölçüm yüzeyi kararı: SIKIŞTIRILMIŞ (gzip ve brotli) bayt, ham dosya boyutu değil.
 *
 * docs/05-deneyim-ve-guvenlik.md Bölüm 3'teki hız hedefleri zaten "ilk
 * yükleme JS boyutu < 200 KB (SIKIŞTIRILMIŞ)" diyor — bu script o hedefi
 * hiç ölçmüyordu, ham baytı ölçüyordu. Bunun pratik sonucu: ana sayfaya
 * tekrarlayan Tailwind sınıflarıyla dolu, çok iyi sıkışan (89 dersin
 * tamamını gömen RSC flight payload'ı gibi) statik biçimlendirme eklendiğinde
 * ham bayt bütçeyi patlatıyordu ama gerçek kullanıcının indirdiği bayt
 * (gzip/brotli, Vercel/Cloudflare Pages ikisini de otomatik uygular) çok daha
 * küçüktü — ölçülen yüzey gerçek etkiyle örtüşmüyordu.
 *
 * Gzip ve brotli Node'un yerleşik `zlib` desteğiyle ayrı ölçülür; yeni
 * bağımlılık eklenmez. Gzip eski istemciler için güvenli tabanı, brotli ise
 * modern statik barındırma yüzeyindeki gerçek aktarım maliyetini korur.
 *
 * UYARI: bu sadece ÖLÇÜM yüzeyini düzeltir. Ana sayfanın "kaldığın yerden
 * devam et" paneline 89 dersin tamamını prop olarak geçiren mimari israf
 * ayrı bir kök nedendi ve ayrıca düzeltildi (bkz. scripts/build-continue-index.ts,
 * components/home/ContinueLearning.tsx) — bütçeyi büyütüp geçmek o israfı
 * gizlerdi, çözmezdi.
 */
import {
  extractInitialLocalAssets,
  measureFiles,
  referencedLazyChunks,
  sumTransferSizes,
  type TransferSize,
} from "../lib/performanceBudget";

const KIB = 1024;
const MIB = 1024 * KIB;
const outDir = path.resolve("out");

interface SurfaceConfig {
  name: string;
  html: string;
  deferred: "none" | "scene" | "code-runner";
  initialScriptGzip?: number;
  budget: { gzip: number; brotli: number };
}

const surfaces: SurfaceConfig[] = [
  { name: "Ana sayfa", html: "index.html", deferred: "none", initialScriptGzip: 200 * KIB, budget: { gzip: 220 * KIB, brotli: 200 * KIB } },
  { name: "3D'siz ders", html: "ders/a-ortaokul-robot-nedir.html", deferred: "none", budget: { gzip: 255 * KIB, brotli: 240 * KIB } },
  { name: "3D ders", html: "ders/b-lise-geometrik-ters-kinematik.html", deferred: "scene", budget: { gzip: 530 * KIB, brotli: 480 * KIB } },
  { name: "CodeRunner", html: "ders/d-lise-python-komut-dizisi.html", deferred: "code-runner", budget: { gzip: 7 * MIB, brotli: 6.25 * MIB } },
];

const pythonRuntimeAssets = [
  "/workers/pyodide-worker.js",
  "/pyodide/pyodide.mjs",
  "/pyodide/pyodide.asm.mjs",
  "/pyodide/pyodide.asm.wasm",
  "/pyodide/python_stdlib.zip",
  "/pyodide/pyodide-lock.json",
];

function format(size: number): string {
  return `${(size / KIB).toFixed(1)} KiB`;
}

function add(left: TransferSize, right: TransferSize): TransferSize {
  return sumTransferSizes([left, right]);
}

if (!fs.existsSync(outDir)) throw new Error("out/ yok; önce npm run build çalıştırın.");

let failed = false;
for (const surface of surfaces) {
  const htmlPath = path.join(outDir, surface.html);
  if (!fs.existsSync(htmlPath)) throw new Error(`${surface.html} yok; önce npm run build çalıştırın.`);

  const html = fs.readFileSync(htmlPath, "utf8");
  const initialAssets = extractInitialLocalAssets(html);
  const initialScripts = measureFiles(outDir, initialAssets.filter((asset) => asset.endsWith(".js")));
  const initial = measureFiles(outDir, [surface.html, ...initialAssets]);
  const sceneAssets = surface.deferred === "none" ? [] : referencedLazyChunks(outDir, initialAssets);
  const deferredAssets = surface.deferred === "code-runner"
    ? [...sceneAssets, ...pythonRuntimeAssets]
    : sceneAssets;
  const deferred = measureFiles(outDir, deferredAssets);
  const total = add(initial, deferred);
  const initialScriptBudget = surface.initialScriptGzip;

  console.log(
    `${surface.name}: başlangıç JS gzip ${format(initialScripts.gzip)}` +
      (initialScriptBudget === undefined ? " (bilgi); " : ` / ${format(initialScriptBudget)}; `) +
      `başlangıç toplam gzip ${format(initial.gzip)} / br ${format(initial.brotli)}; ` +
      `etkileşim gzip ${format(deferred.gzip)} / br ${format(deferred.brotli)}; ` +
      `toplam gzip ${format(total.gzip)} / ${format(surface.budget.gzip)}, ` +
      `br ${format(total.brotli)} / ${format(surface.budget.brotli)}`,
  );

  if (total.gzip > surface.budget.gzip || total.brotli > surface.budget.brotli) {
    console.error(`${surface.name} sıkıştırılmış aktarım bütçesini aştı.`);
    failed = true;
  }

  if (initialScriptBudget !== undefined && initialScripts.gzip > initialScriptBudget) {
    console.error(`${surface.name} ilk yükleme JS gzip bütçesini aştı.`);
    failed = true;
  }

  if (surface.deferred === "none") {
    const initialGraph = initialAssets
      .filter((asset) => asset.endsWith(".js"))
      .map((asset) => fs.readFileSync(path.join(outDir, asset.replace(/^\//, "")), "utf8"))
      .join("\n");
    if (/pyodide\.asm|WebGLRenderer/.test(initialGraph)) {
      console.error(`${surface.name} başlangıç grafiğine ağır worker/3D varlığı sızdı.`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
