import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["reference-python/**", ".next/**", "out/**", "public/pyodide/**", "public/workers/**"],
  },
];

export default eslintConfig;
