import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["reference-python/**", ".next/**", "out/**"],
  },
];

export default eslintConfig;
