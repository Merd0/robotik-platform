import { describe, expect, it } from "vitest";
import {
  buildParametreCode,
  buildParametrePreamble,
  evaluateKodaParametreSenaryo,
  KODA_PARAMETRE_SENARYOLARI,
  type KodaParametreSenaryo,
} from "./kodaParametreTransfer";

function senaryo(id: string): KodaParametreSenaryo {
  const bulunan = KODA_PARAMETRE_SENARYOLARI.find((s) => s.id === id);
  if (!bulunan) throw new Error(`Senaryo bulunamadı: ${id}`);
  return bulunan;
}

describe("KODA_PARAMETRE_SENARYOLARI — fixture sağlığı", () => {
  it("bir görünür, bir gizli senaryo var; hedefler farklı", () => {
    expect(KODA_PARAMETRE_SENARYOLARI).toHaveLength(2);
    const gorunur = senaryo("gorunur");
    const gizli = senaryo("gizli-transfer");
    expect(gorunur.gizli).toBe(false);
    expect(gizli.gizli).toBe(true);
    expect([gorunur.hedefJ1Derece, gorunur.hedefJ2Derece]).not.toEqual([gizli.hedefJ1Derece, gizli.hedefJ2Derece]);
  });

  it("her hedef generic-2dof'un eklem limitleri içinde (±180°)", () => {
    for (const s of KODA_PARAMETRE_SENARYOLARI) {
      expect(Math.abs(s.hedefJ1Derece)).toBeLessThanOrEqual(180);
      expect(Math.abs(s.hedefJ2Derece)).toBeLessThanOrEqual(180);
    }
  });
});

describe("buildParametrePreamble / buildParametreCode", () => {
  it("hedef açılarını Python değişkeni olarak enjekte eder", () => {
    expect(buildParametrePreamble(senaryo("gorunur"))).toBe("HEDEF_J1 = 90\nHEDEF_J2 = -60\n");
  });

  it("önek ile öğrenci kodunu birleştirir", () => {
    const kod = buildParametreCode(senaryo("gorunur"), "print('merhaba')");
    expect(kod.endsWith("print('merhaba')")).toBe(true);
  });
});

describe("evaluateKodaParametreSenaryo — golden + negatif", () => {
  it("golden: doğru açılara ulaşan çözüm her iki senaryoyu da geçer", () => {
    for (const s of KODA_PARAMETRE_SENARYOLARI) {
      const rad = [s.hedefJ1Derece, s.hedefJ2Derece].map((d) => (d * Math.PI) / 180);
      expect(evaluateKodaParametreSenaryo(s, { error: null, jointTrace: [rad] }).gecti).toBe(true);
    }
  });

  it("negatif: yakalanmamış hata her zaman başarısızdır", () => {
    expect(evaluateKodaParametreSenaryo(senaryo("gorunur"), { error: "NameError: ...", jointTrace: [] }).gecti).toBe(false);
  });

  it("negatif: hiç hareket etmemiş çözüm geçmez", () => {
    expect(evaluateKodaParametreSenaryo(senaryo("gorunur"), { error: null, jointTrace: [] }).gecti).toBe(false);
  });

  it("negatif (kör transfer koruması): görünür hedefi sabit sayı olarak yazan çözüm gizli senaryoda başarısız olur", () => {
    const gorunur = senaryo("gorunur");
    const rad = [gorunur.hedefJ1Derece, gorunur.hedefJ2Derece].map((d) => (d * Math.PI) / 180);
    expect(evaluateKodaParametreSenaryo(senaryo("gizli-transfer"), { error: null, jointTrace: [rad] }).gecti).toBe(false);
  });
});
