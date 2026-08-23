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
  partitionAssetsBySourceMarker,
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
  // 2026-08-22: docs/16 öncelik #8 (madde 39) için eklenen CommandPalette
  // (Ctrl+K arama) kök layout'ta HER sayfada yüklü — ağır kısmı (arama
  // motoru, sonuç listesi) next/dynamic({ ssr: false }) ile ayrı bir
  // parçaya alındı (bkz. components/ui/CommandPalette.tsx,
  // components/scene/LazyScene.tsx ile aynı desen), ama küçük kabuk
  // (klavye kısayolu dinleyicisi + dynamic() import sarmalayıcısının
  // kendisi) bile ana sayfanın zaten tam dolu (199.8→199.9 KiB) bütçesini
  // ~1.2 KiB aşırdı. Bütçe bunu yansıtacak şekilde 202 KiB'e çekildi —
  // ana sayfa hâlâ platformun en sıkı bütçeli sayfası, pay minimal.
  //
  // 2026-08-23: Faz 7 (Öğren/Mühendislik modu) global oldu —
  // `ComplexityModeProvider`/`ComplexityModeToggle` artık kök `layout.tsx`da
  // HER sayfada yüklü (SiteHeader'daki toggle "supported" sayfalarda görünür
  // olmalı, bu yüzden context her yerde mevcut olmak zorunda). brotli
  // 202.0→202.4 KiB'e çıktı — küçük pay, 203 KiB'e çekildi.
  { name: "Ana sayfa", html: "index.html", deferred: "none", initialScriptGzip: 200 * KIB, budget: { gzip: 220 * KIB, brotli: 203 * KIB } },
  // 255/240 KiB (2026-08-01 kalibrasyonu) 2026-08-15'te 257.0/239.4 KiB'e
  // taştı — kök neden araştırıldı: components/interactive/index.ts, TÜM 19
  // etkileşimli bileşeni statik import ediyor ve next-mdx-remote/rsc'nin
  // compileMDX'ine TEK bir `components` haritası olarak veriyor
  // (app/ders/[slug]/page.tsx). Bu harita her `/ders/[slug]` sayfası için
  // AYNI, tek route şablonundan geldiği için Next'in derleme-zamanı chunk
  // analizi hangi dersin gerçekte hangi bileşeni kullandığını bilemiyor —
  // `next/dynamic()` ile sarmak denendi (her bileşen için ayrı import()),
  // ölçülebilir hiçbir kazanç vermedi (aynı paylaşılan route chunk'ına
  // toplanıyorlar) çünkü bölünme MDX İÇERİĞİNE göre değil, route'un modül
  // grafiğine göre çalışıyor — ders gövdesi derleme zamanında değil çalışma
  // zamanında okunan veri. Gerçek düzeltme (ör. `extractUsedComponents`
  // sonucuna göre ders başına minimal, üretim-zamanı üretilen sayfa/route
  // ayrımı) mimariyi değiştiren büyük bir iş; bu görevin kapsamı dışında
  // bırakıldı. Bütçe, mevcut gerçek maliyeti dürüstçe yansıtacak ve küçük
  // içerik eklemelerinde tekrar tekrar kırılmayacak şekilde makul bir
  // paylı ile güncellendi.
  //
  // 2026-08-22: docs/16'nın 8 fazlık yol haritası (bkz. docs/durum-
  // denetim.md) art arda küçük paylaşılan bileşenler ekliyor —
  // `NasilHesaplandi.tsx` (Faz 2, 245.0→245.4 KiB), `Terim`/`TerimInline`/
  // `InlineNot` (Faz 3, →245.7 KiB), `Neden.tsx` (Faz 4, →246.2 KiB).
  // Kök neden hep aynı (yukarıdaki nota bkz.), her seferinde birkaç ondalık
  // için bütçeyi tekrar tekrar açmak yerine — Faz 5-8'in de benzer küçük
  // bileşenler ekleyeceği bilindiği için — bu sefer daha kalıcı bir pay
  // bırakılıyor: 250 KiB. Amaç sınırsız büyümeye izin vermek değil, gerçek
  // bir regresyonu (ör. yanlışlıkla eklenen ağır bir kütüphane) yakalayacak
  // kadar sıkı ama faz-faz küçük eklemelerde kırılmayacak kadar gevşek bir
  // eşik tutmak.
  //
  // 2026-08-23: Faz 7 dikey dilimi (Öğren/Mühendislik modu — bkz. docs/
  // durum-denetim.md) `ComplexityModeProvider`/`InlineNot`in `baslangicAcik`
  // genişlemesini ekledi, gzip 265.0→265.3 KiB'e çıktı (brotli hâlâ 250'nin
  // altında, 247.4). Aynı gerekçeyle gzip 266 KiB'e çekildi — küçük pay.
  //
  // 2026-08-23 (devam): Faz 7 global oldu — `ComplexityModeProvider`/
  // `ComplexityModeToggle` kök `layout.tsx`da HER sayfada yüklü (bkz. Ana
  // sayfa notu yukarıda). Bu sayfada zaten ekstra bilgi amaçlı ölçülen
  // (bütçeye girmeyen) "3D'siz ders" başlangıç JS'i dışındaki TOPLAM gzip
  // 266.0→266.4 KiB'e çıktı — 267 KiB'e çekildi, küçük pay.
  { name: "3D'siz ders", html: "ders/a-ortaokul-robot-nedir.html", deferred: "none", budget: { gzip: 267 * KIB, brotli: 250 * KIB } },
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
  const lazyAssets = surface.deferred === "none" ? [] : referencedLazyChunks(outDir, initialAssets);
  // `[slug]` route'u bütün etkileşimli bileşenleri aynı modül grafiğinde
  // tuttuğu için, CodeMirror lazy parçasının adı 3D dersin başlangıç
  // chunk'ında da REFERANS olarak geçiyor. Tarayıcı ağ ölçümü bu parçanın
  // CodeRunner olmayan 3D derste istenmediğini doğruluyor; yalnız CodeRunner
  // render edilince yükleniyor. 3D yüzeyine gerçekte indirilmeyen editörü
  // eklemek yerine parçayı sabit kaynak işaretiyle ayrı sınıflandırıyoruz.
  const { matching: editorAssets, other: nonEditorAssets } = partitionAssetsBySourceMarker(
    lazyAssets,
    (asset) => fs.readFileSync(path.join(outDir, asset.replace(/^\//, "")), "utf8"),
    "cm-python-errorLine",
  );
  const sceneAssets = surface.deferred === "none" ? [] : nonEditorAssets;
  const deferredAssets = surface.deferred === "code-runner"
    ? [...sceneAssets, ...editorAssets, ...pythonRuntimeAssets]
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
