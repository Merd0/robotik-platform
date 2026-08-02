import { build } from "esbuild";
import path from "node:path";

/**
 * lib/workers/ altındaki worker giriş dosyalarını tek tek, self-contained
 * klasik (non-module) script'lere derleyip public/workers/ altına yazar.
 *
 * Neden Next'in kendi `new Worker(new URL(...))` desteği yerine bu:
 * hem Turbopack hem webpack ile denendi, ikisinde de derlenen worker
 * chunk'ı boş/eksik çıktı (gerçek kod hiç bundle'a girmedi — Next 16.2'nin
 * worker desteği bu proje kurulumunda güvenilir değil). esbuild ile elle,
 * önceden (build/dev başlamadan) derleyip public/ altına sabit bir dosya
 * olarak koymak, çalışma zamanında bundler sihrine bağımlı olmayan,
 * statik export'ta garanti çalışan bir çözüm.
 *
 * Not: bu script "npm run dev" başlarken BİR KEZ çalışır, dosya izlemez
 * (watch yok). lib/workers/ içindeki bir dosyayı veya bağımlılığını
 * değiştirirsen dev sunucusunu yeniden başlatman gerekir.
 */
const ENTRIES = [
  { entry: "lib/workers/plannerWorker.ts", out: "public/workers/planner-worker.js" },
  { entry: "lib/workers/pyodideWorker.ts", out: "public/workers/pyodide-worker.js" },
];

for (const { entry, out } of ENTRIES) {
  await build({
    entryPoints: [path.join(process.cwd(), entry)],
    bundle: true,
    outfile: path.join(process.cwd(), out),
    format: "iife",
    target: "es2020",
    minify: true,
    sourcemap: true,
    platform: "browser",
    // pyodide.mjs, sadece Node'da çalışan (IN_NODE kontrolü arkasındaki,
    // tarayıcıda hiç yürütülmeyen) dinamik "node:*" importları içeriyor.
    // Tarayıcı hedefinde bunları çözmeye çalışmak build'i kırıyor; external
    // bırakmak (hiç yürütülmeyecekleri için) zararsız.
    external: ["node:*"],
  });
  console.log(`${out} derlendi.`);
}
