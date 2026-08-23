export type ComplexityMode = "learn" | "engineering";

export const COMPLEXITY_MODE_STORAGE_KEY = "robotik-platform:complexity-mode";

export const DEFAULT_COMPLEXITY_MODE: ComplexityMode = "learn";

export function resolveComplexityMode(stored: string | null): ComplexityMode {
  return stored === "engineering" ? "engineering" : DEFAULT_COMPLEXITY_MODE;
}
