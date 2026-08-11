import { describe, expect, it } from "vitest";
import { buildScanOrder, scanDirectionAlternates } from "./scanPath";

describe("buildScanOrder", () => {
  it("golden: ardışık satırları zıt yönde ve eksiksiz üretir", () => {
    const order = buildScanOrder(2, 3);
    expect(order).toEqual([
      { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 },
      { col: 2, row: 1 }, { col: 1, row: 1 }, { col: 0, row: 1 },
    ]);
    expect(scanDirectionAlternates(order, 2, 3)).toBe(true);
  });

  it("negatif: eksik veya yanlış yönlü sıra geçerli boustrophedon sayılmaz", () => {
    expect(scanDirectionAlternates([{ col: 0, row: 0 }], 2, 3)).toBe(false);
    expect(scanDirectionAlternates([
      { col: 0, row: 0 }, { col: 1, row: 0 },
      { col: 0, row: 1 }, { col: 1, row: 1 },
    ], 2, 2)).toBe(false);
  });

  it("negatif: sıfır/ondalıklı boyutu açıkça reddeder", () => {
    expect(() => buildScanOrder(0)).toThrow();
    expect(() => buildScanOrder(2.5)).toThrow();
  });
});
