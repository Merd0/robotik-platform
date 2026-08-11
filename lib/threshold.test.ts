import { describe, expect, it } from "vitest";
import { analyzeThreshold, buildThresholdGrid } from "./threshold";

describe("analyzeThreshold", () => {
  it("golden: 128 eşiği nesneyi false positive/negative olmadan ayırır", () => {
    expect(analyzeThreshold(128)).toMatchObject({
      detectedCount: 21,
      objectCellCount: 21,
      falsePositiveCount: 0,
      falseNegativeCount: 0,
      regime: "separating",
    });
  });

  it("negatif rejimler: düşük eşik arka planı, yüksek eşik nesneyi kaybeder", () => {
    expect(analyzeThreshold(30)).toMatchObject({ regime: "too-low", falseNegativeCount: 0 });
    expect(analyzeThreshold(30).falsePositiveCount).toBeGreaterThan(0);
    expect(analyzeThreshold(230)).toMatchObject({ regime: "too-high", falsePositiveCount: 0 });
    expect(analyzeThreshold(230).falseNegativeCount).toBeGreaterThan(0);
  });

  it("parlaklık ızgarası her çağrıda aynı 8×12 veriyi üretir", () => {
    expect(buildThresholdGrid()).toEqual(buildThresholdGrid());
    expect(buildThresholdGrid()).toHaveLength(8);
    expect(buildThresholdGrid()[0]).toHaveLength(12);
  });
});
