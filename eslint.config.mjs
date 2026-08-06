import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    // `.codex-worktree-*`: git worktree'leri repo kökünün altında yaşıyor ve
    // kendi .next/out çıktılarını taşıyor. .gitignore'da olmaları eslint'i
    // durdurmuyor — burada da hariç tutulmazsa lint, başka bir çalışma
    // kopyasının derleme çıktısını tarayıp yüzlerce alakasız hata üretiyor.
    ignores: [
      "reference-python/**",
      ".next/**",
      "out/**",
      "public/pyodide/**",
      "public/workers/**",
      ".codex-worktree-*/**",
      "**/.next/**",
    ],
  },
];

export default eslintConfig;
