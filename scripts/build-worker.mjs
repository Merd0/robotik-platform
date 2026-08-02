import { build } from "esbuild";
import path from "node:path";

/**
 * lib/workers/plannerWorker.ts'i tek bir self-contained klasik (non-module)
 * script'e derleyip public/workers/ altına yazar.
 *
 * Neden Next'in kendi `new Worker(new URL(...))` desteği yerine bu:
 * hem Turbopack hem webpack ile denendi, ikisinde de derlenen worker
 * chunk'ı boş/eksik çıktı (gerçek planlayıcı kodu hiç bundle'a girmedi —
 * Next 16.2'nin worker desteği bu proje kurulumunda güvenilir değil).
 * esbuild ile elle, önceden (build/dev başlamadan) derleyip public/ altına
 * sabit bir dosya olarak koymak, çalışma zamanında bundler sihrine bağımlı
 * olmayan, statik export'ta garanti çalışan bir çözüm.
 *
 * Not: bu script "npm run dev" başlarken BİR KEZ çalışır, dosya izlemez
 * (watch yok). lib/workers/plannerWorker.ts veya lib/robotics/ içindeki bir
 * bağımlılığı değiştirirsen dev sunucusunu yeniden başlatman gerekir.
 */
await build({
  entryPoints: [path.join(process.cwd(), "lib/workers/plannerWorker.ts")],
  bundle: true,
  outfile: path.join(process.cwd(), "public/workers/planner-worker.js"),
  format: "iife",
  target: "es2020",
  minify: true,
  sourcemap: true,
});

console.log("public/workers/planner-worker.js derlendi.");
