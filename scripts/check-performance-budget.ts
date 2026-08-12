import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

/**
 * Ölçüm yüzeyi kararı: SIKIŞTIRILMIŞ (gzip) bayt, ham dosya boyutu değil.
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
 * gzip seçildi, brotli değil: ikisi de Node'un yerleşik `zlib`'inde (yeni
 * bağımlılık yok, docs/08 minimum bağımlılık ilkesi), ama gzip HER tarayıcıda
 * desteklenir; brotli neredeyse evrensel (~%97) ama tam değil. Bütçe bir
 * güvenlik marjı olduğu için en KÖTÜ makul durumu (gzip'e düşen istemci)
 * ölçmek daha güvenli — brotli zaten daha küçük çıkar, bu yüzden gzip altında
 * geçen bir sayfa brotli altında da geçer. Ham bayt da konsolda loglanmaya
 * devam ediyor (görünürlük için) ama tek başına build'i kırmıyor.
 *
 * UYARI: bu sadece ÖLÇÜM yüzeyini düzeltir. Ana sayfanın "kaldığın yerden
 * devam et" paneline 89 dersin tamamını prop olarak geçiren mimari israf
 * ayrı bir kök nedendi ve ayrıca düzeltildi (bkz. scripts/build-continue-index.ts,
 * components/home/ContinueLearning.tsx) — bütçeyi büyütüp geçmek o israfı
 * gizlerdi, çözmezdi.
 */

const out = path.resolve("out");
const htmlPath = path.join(out, "index.html");
if (!fs.existsSync(htmlPath)) throw new Error("out/index.html yok; önce npm run build çalıştırın.");

const html = fs.readFileSync(htmlPath, "utf8");
const localAssets = (pattern: RegExp) => [...html.matchAll(pattern)].map((match) => match[1]).filter((url) => url.startsWith("/"));
const scripts = [...new Set(localAssets(/<script[^>]+src="([^"]+)"/g))];
const styles = [...new Set(localAssets(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g))];

const rawBytes = (asset: string) => fs.readFileSync(path.join(out, asset.replace(/^\//, ""))).length;
const gzipBytes = (buffer: Buffer) => gzipSync(buffer, { level: 9 }).length;
const gzipBytesOfFile = (asset: string) => gzipBytes(fs.readFileSync(path.join(out, asset.replace(/^\//, ""))));
const gzipBytesOfAssets = (assets: string[]) => assets.reduce((total, asset) => total + gzipBytesOfFile(asset), 0);

const rawMeasurements = {
  htmlBytes: fs.statSync(htmlPath).size,
  initialScriptBytes: scripts.reduce((total, asset) => total + rawBytes(asset), 0),
  initialStyleBytes: styles.reduce((total, asset) => total + rawBytes(asset), 0),
};
const gzipMeasurements = {
  htmlBytes: gzipBytes(fs.readFileSync(htmlPath)),
  initialScriptBytes: gzipBytesOfAssets(scripts),
  initialStyleBytes: gzipBytesOfAssets(styles),
};

// docs/05'teki "< 200 KB (sıkıştırılmış)" JS hedefiyle hizalı; html/style için
// aynı dokümanda ayrı bir sayı yok, burada ~2 katı makul bir tavan olarak
// seçildi (2026-08-12, htmlBytes ~13 KB, initialScriptBytes ~170 KB,
// initialStyleBytes ~14 KB ölçüldükten sonra, gerçek değerin üstünde ama
// sıkı bir baş payı bırakacak şekilde).
const gzipBudgets = { htmlBytes: 25_000, initialScriptBytes: 200_000, initialStyleBytes: 30_000 };
const failures = Object.entries(gzipBudgets).filter(([key, budget]) => gzipMeasurements[key as keyof typeof gzipMeasurements] > budget);

console.log("Ana sayfa ham başlangıç bütçesi (bilgi amaçlı, kapı değil):", rawMeasurements);
console.log("Ana sayfa gzip başlangıç bütçesi (gerçek ağ etkisi, kapı):", gzipMeasurements);
if (failures.length > 0) {
  for (const [key, budget] of failures) console.error(`${key}: ${gzipMeasurements[key as keyof typeof gzipMeasurements]} > ${budget} (gzip)`);
  process.exit(1);
}

const initialUrls = [...scripts, ...styles].join("\n");
if (initialUrls.includes("pyodide") || initialUrls.includes("worker")) {
  console.error("Ağır Pyodide/worker varlığı ana sayfa başlangıç grafiğine sızdı.");
  process.exit(1);
}
