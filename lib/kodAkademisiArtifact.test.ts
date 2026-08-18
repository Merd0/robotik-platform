import { describe, expect, it } from "vitest";
import { computeModuleHash, type KodAkademisiModuleInput } from "./kodAkademisiArtifact";

const baseModule: KodAkademisiModuleInput = {
  frontmatter: {
    baslik: "İlk çalıştırma",
    asama: "temel",
    sira: 1,
    kazanimlar: ["Çalıştır düğmesine basıp robotun tepkisini gözlemleyebilme"],
    ipuclari: ["Önce Çalıştır'a bas.", "Kodu değiştirmene gerek yok.", "Sonuç panelinde TCP değerine bak."],
    cozum: "robot.movej([0, 45, -30])",
  },
  body: "## Kanca\n\nÇalıştır'a bas, robotun ne yaptığını gör.\n",
  initialCode: "robot.movej([0, 45, -30])",
  predicateIds: ["koda-temel-ilk-calistirma-v1"],
};

describe("Kod Akademisi modül hash'i", () => {
  it("satır sonlarını kanonikleştirir", () => {
    const crlf: KodAkademisiModuleInput = { ...baseModule, body: "## Kanca\r\n\r\nÇalıştır'a bas, robotun ne yaptığını gör.\r\n" };
    expect(computeModuleHash(crlf)).toBe(computeModuleHash(baseModule));
  });

  it("gövde metni değişince hash değişir", () => {
    const degisen: KodAkademisiModuleInput = { ...baseModule, body: "Değişen metin" };
    expect(computeModuleHash(degisen)).not.toBe(computeModuleHash(baseModule));
  });

  it("başlangıç kodu değişince hash değişir", () => {
    const degisen: KodAkademisiModuleInput = { ...baseModule, initialCode: "robot.movej([0, 0, 0])" };
    expect(computeModuleHash(degisen)).not.toBe(computeModuleHash(baseModule));
  });

  it("ipuçları veya çözüm değişince hash değişir", () => {
    const ipucuDegisen: KodAkademisiModuleInput = {
      ...baseModule,
      frontmatter: { ...baseModule.frontmatter, ipuclari: ["Farklı bir ipucu.", "İkinci ipucu.", "Üçüncü ipucu."] },
    };
    expect(computeModuleHash(ipucuDegisen)).not.toBe(computeModuleHash(baseModule));

    const cozumDegisen: KodAkademisiModuleInput = {
      ...baseModule,
      frontmatter: { ...baseModule.frontmatter, cozum: "robot.movej([10, 20, 30])" },
    };
    expect(computeModuleHash(cozumDegisen)).not.toBe(computeModuleHash(baseModule));
  });

  it("bağlı predicate kümesi değişince hash değişir", () => {
    // İnteraksiyon manifestindeki interactionHash/predicateHash felsefesiyle
    // aynı: modülü ÇALIŞTIRAN kod aynı kalsa bile, davranışsal doğrulama
    // mantığı değişirse (yeni predicate id'si) eski kanıt artık aynı deneyin
    // kanıtı değildir.
    const yeniPredicate: KodAkademisiModuleInput = { ...baseModule, predicateIds: ["koda-temel-ilk-calistirma-v2"] };
    expect(computeModuleHash(yeniPredicate)).not.toBe(computeModuleHash(baseModule));
  });

  it("predicate id sırası hash'i etkilemez (kümeler sıralanır)", () => {
    const cokPredicateA: KodAkademisiModuleInput = { ...baseModule, predicateIds: ["a-v1", "b-v1"] };
    const cokPredicateB: KodAkademisiModuleInput = { ...baseModule, predicateIds: ["b-v1", "a-v1"] };
    expect(computeModuleHash(cokPredicateA)).toBe(computeModuleHash(cokPredicateB));
  });

  it("sira veya asama değişince hash değişir", () => {
    const siraDegisen: KodAkademisiModuleInput = { ...baseModule, frontmatter: { ...baseModule.frontmatter, sira: 2 } };
    expect(computeModuleHash(siraDegisen)).not.toBe(computeModuleHash(baseModule));

    const asamaDegisen: KodAkademisiModuleInput = { ...baseModule, frontmatter: { ...baseModule.frontmatter, asama: "orta" } };
    expect(computeModuleHash(asamaDegisen)).not.toBe(computeModuleHash(baseModule));
  });

  it("aynı girdi her zaman aynı hash'i üretir (deterministik)", () => {
    expect(computeModuleHash(baseModule)).toBe(computeModuleHash({ ...baseModule }));
  });
});
