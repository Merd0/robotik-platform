import { describe, expect, it } from "vitest";
import { createFourLensTrace, finalXDirection } from "./fourLensTrace";

describe("dört lens ileri kinematik izi", () => {
  it("sahne, matris ve grafiği aynı eklem örneğinden üretir", () => {
    const trace = createFourLensTrace();
    for (const sample of trace) {
      expect(sample.endTransform[0][3]).toBeCloseTo(sample.end.x, 12);
      expect(sample.endTransform[1][3]).toBeCloseTo(sample.end.y, 12);
      expect(sample.jointDegrees[0] * Math.PI / 180).toBeCloseTo(sample.jointRadians[0], 12);
    }
  });

  it("son kod satırının x yönünü hesaplanan izden türetir", () => {
    expect(finalXDirection(createFourLensTrace())).toBe("decrease");
  });

  it("bağ uzunluğu değişince tüm lenslerde aynı yeni konumu taşır", () => {
    const last = createFourLensTrace(undefined, [2, 1])[3];
    expect(last.endTransform[0][3]).toBeCloseTo(last.end.x);
    expect(last.endTransform[1][3]).toBeCloseTo(last.end.y);
  });
});
