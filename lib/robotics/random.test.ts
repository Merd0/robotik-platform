import { describe, expect, it } from "vitest";
import { createSeededRandom } from "./random";

describe("createSeededRandom", () => {
  it("aynı seed için tekrar üretilebilir dizi verir", () => {
    const first = createSeededRandom(240807);
    const second = createSeededRandom(240807);
    expect(Array.from({ length: 8 }, first)).toEqual(Array.from({ length: 8 }, second));
  });

  it("çıktıyı [0, 1) aralığında tutar", () => {
    const random = createSeededRandom(-1);
    const values = Array.from({ length: 100 }, random);
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});
