import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig'deki "@/*" yolu Next tarafında çözülüyor ama Vitest kendi
  // çözümleyicisini kullanıyor. Alias burada tanımlı olmadan, `@/` ile
  // import eden bir uygulama dosyasını (ör. app/sitemap.ts) test etmek
  // "Cannot find package '@/lib/content'" hatası veriyor.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    exclude: ["node_modules", "reference-python", ".next"],
  },
});
