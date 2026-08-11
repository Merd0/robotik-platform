import { describe, expect, it } from "vitest";
import { analyzeHandshake } from "./signalTimeline";

describe("analyzeHandshake", () => {
  it("golden: istekten sonraki onayı doğru sıra olarak kabul eder", () => {
    expect(analyzeHandshake([
      [false, true, false, false],
      [false, false, false, true],
    ])).toEqual({ requestStep: 2, acknowledgementStep: 4, complete: true, correctOrder: true });
  });

  it("negatif: istekten önce gelen onayı reddeder", () => {
    expect(analyzeHandshake([
      [false, false, false, true],
      [false, true, false, false],
    ]).correctOrder).toBe(false);
  });

  it("negatif: aynı adımdaki istek ve onayı reddeder", () => {
    expect(analyzeHandshake([
      [false, true],
      [false, true],
    ]).correctOrder).toBe(false);
  });

  it("negatif: iki sinyalden biri eksikse düzeni tamamlanmamış sayar", () => {
    expect(analyzeHandshake([[false, true], [false, false]])).toMatchObject({
      acknowledgementStep: null,
      complete: false,
      correctOrder: false,
    });
  });
});
