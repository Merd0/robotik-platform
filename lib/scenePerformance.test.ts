import { describe, expect, it } from "vitest";
import { selectSceneDpr } from "./scenePerformance";

describe("selectSceneDpr", () => {
  it("mobil ve düşük kapasiteli cihazlarda DPR'ı 1.25 ile sınırlar", () => {
    expect(selectSceneDpr({ viewportWidth: 390, devicePixelRatio: 3, hardwareConcurrency: 8 })).toBe(1.25);
    expect(selectSceneDpr({ viewportWidth: 1440, devicePixelRatio: 2, hardwareConcurrency: 4 })).toBe(1.25);
  });

  it("geniş ve güçlü cihazlarda 1.75'e kadar ayrıntı kullanır", () => {
    expect(selectSceneDpr({ viewportWidth: 1440, devicePixelRatio: 2, hardwareConcurrency: 8 })).toBe(1.75);
  });

  it("1x ekranda gereksiz yükseltme yapmaz", () => {
    expect(selectSceneDpr({ viewportWidth: 1440, devicePixelRatio: 1, hardwareConcurrency: 8 })).toBe(1);
  });
});
