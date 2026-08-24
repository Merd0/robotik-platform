import { describe, expect, it } from "vitest";
import { analyzeHandshake, describeSignalGap } from "./signalTimeline";

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

describe("describeSignalGap", () => {
  const names: [string, string] = ["Robot", "PLC"];

  it("golden: doğru sırayı adım+ms farkıyla ve 'Sıra doğru' notuyla anlatır", () => {
    const analysis = analyzeHandshake([
      [false, true, false, false],
      [false, false, false, true],
    ]);
    expect(describeSignalGap(analysis, names, 500, true)).toBe(
      '"Robot" önce geldi (2. adım), "PLC" 2 adım (1000 ms) sonra geldi. Sıra doğru.',
    );
  });

  it("negatif: ters sırada 'Sıra ters' uyarısı verir, isim ilk sinyali gösterir", () => {
    const analysis = analyzeHandshake([
      [false, false, false, true],
      [false, true, false, false],
    ]);
    expect(describeSignalGap(analysis, names, 500, true)).toBe(
      '"PLC" önce geldi (2. adım), "Robot" 2 adım (1000 ms) sonra geldi. Sıra ters — önce "Robot" açılmalıydı.',
    );
  });

  it("requireOrder=false iken doğru/yanlış yargısı eklemez", () => {
    const analysis = analyzeHandshake([
      [false, true, false, false],
      [false, false, false, true],
    ]);
    expect(describeSignalGap(analysis, names, 500, false)).toBe(
      '"Robot" önce geldi (2. adım), "PLC" 2 adım (1000 ms) sonra geldi.',
    );
  });

  it("aynı adımda açılan sinyaller için fark yok der", () => {
    const analysis = analyzeHandshake([
      [false, true],
      [false, true],
    ]);
    expect(describeSignalGap(analysis, names, 500, true)).toBe(
      '"Robot" ve "PLC" aynı adımda (2. adım) açıldı — fark yok.',
    );
  });

  it("bir sinyal hiç açılmadıysa bunu açıkça söyler", () => {
    const analysis = analyzeHandshake([[false, false], [false, true]]);
    expect(describeSignalGap(analysis, names, 500, true)).toBe(
      '"Robot" hiç açılmadı; "PLC" 2. adımda açıldı.',
    );
  });

  it("iki sinyal de hiç açılmadıysa bunu açıkça söyler", () => {
    const analysis = analyzeHandshake([[false, false], [false, false]]);
    expect(describeSignalGap(analysis, names, 500, true)).toBe(
      '"Robot" ve "PLC" hiç açılmadı.',
    );
  });
});
