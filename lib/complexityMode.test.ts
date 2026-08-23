import { describe, expect, it } from "vitest";
import { resolveComplexityMode } from "./complexityMode";

describe("resolveComplexityMode", () => {
  it("geçerli 'engineering' değerini korur", () => {
    expect(resolveComplexityMode("engineering")).toBe("engineering");
  });

  it("null, boş, veya bilinmeyen bir değer için varsayılan 'learn'e döner", () => {
    expect(resolveComplexityMode(null)).toBe("learn");
    expect(resolveComplexityMode("")).toBe("learn");
    expect(resolveComplexityMode("uydurma-deger")).toBe("learn");
  });
});
