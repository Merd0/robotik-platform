import { describe, expect, it } from "vitest";
import { multiply, rotationZ, transformPoint, translation } from "./robotics/transform";
import {
  buildFrameChainCode,
  buildFrameChainPreamble,
  evaluateFrameChainSenaryo,
  KODA_FRAME_CHAIN_SENARYOLARI,
  parseDunyaNoktasi,
  type FrameChainSenaryo,
} from "./kodaFrameChain";

function senaryo(id: string): FrameChainSenaryo {
  const bulunan = KODA_FRAME_CHAIN_SENARYOLARI.find((s) => s.id === id);
  if (!bulunan) throw new Error(`Senaryo bulunamadı: ${id}`);
  return bulunan;
}

describe("KODA_FRAME_CHAIN_SENARYOLARI — fixture sağlığı", () => {
  it("bir görünür, bir gizli senaryo var", () => {
    expect(KODA_FRAME_CHAIN_SENARYOLARI).toHaveLength(2);
    expect(KODA_FRAME_CHAIN_SENARYOLARI.filter((s) => s.gizli)).toHaveLength(1);
  });

  it("beklenenDunyaNoktasi, lib/robotics/transform.ts'in BAĞIMSIZ oracle'ından (translation·rotationZ·nokta) türetildi", () => {
    for (const s of KODA_FRAME_CHAIN_SENARYOLARI) {
      const tabanToWorld = multiply(translation(s.tabanX, s.tabanY, 0), rotationZ(s.tabanAciRad));
      const dunyaNoktasi = transformPoint(tabanToWorld, { x: s.noktaX, y: s.noktaY, z: s.noktaZ });
      expect(dunyaNoktasi.x).toBeCloseTo(s.beklenenDunyaNoktasi[0], 9);
      expect(dunyaNoktasi.y).toBeCloseTo(s.beklenenDunyaNoktasi[1], 9);
      expect(dunyaNoktasi.z).toBeCloseTo(s.beklenenDunyaNoktasi[2], 9);
    }
  });
});

describe("buildFrameChainPreamble / buildFrameChainCode", () => {
  it("senaryo değişkenlerini Python float olarak enjekte eder", () => {
    const preamble = buildFrameChainPreamble(senaryo("gorunur"));
    expect(preamble).toContain("TABAN_X = 1.0");
    expect(preamble).toContain("TABAN_Y = 0.0");
    expect(preamble).toContain("NOKTA_X = 0.5");
  });

  it("mat_carp/nokta_donustur/rotz/translation yardımcılarını tanımlar", () => {
    const preamble = buildFrameChainPreamble(senaryo("gorunur"));
    expect(preamble).toContain("def mat_carp(A, B):");
    expect(preamble).toContain("def nokta_donustur(M, nokta):");
    expect(preamble).toContain("def rotz(aci_rad):");
    expect(preamble).toContain("def translation(x, y, z):");
  });

  it("önek ile öğrenci kodunu birleştirir", () => {
    const kod = buildFrameChainCode(senaryo("gorunur"), "print('merhaba')");
    expect(kod.endsWith("print('merhaba')")).toBe(true);
  });
});

describe("parseDunyaNoktasi", () => {
  it("'x,y,z' formatındaki SON satırı ayrıştırır (önceki gürültü satırlarını yok sayar)", () => {
    expect(parseDunyaNoktasi("bir şeyler\n1.000000,0.500000,0.000000\n")).toEqual([1, 0.5, 0]);
  });

  it("negatif ve bilimsel gösterimli sayıları da ayrıştırır", () => {
    expect(parseDunyaNoktasi("-1.000000,2.000000,1e-07")).toEqual([-1, 2, 1e-7]);
  });

  it("eşleşen satır yoksa null döner", () => {
    expect(parseDunyaNoktasi("hiçbir uygun çıktı yok")).toBeNull();
  });
});

describe("evaluateFrameChainSenaryo — golden + negatif", () => {
  it("golden: doğru sırayla birleştirilmiş matrisin ürettiği nokta her iki senaryoyu da geçer", () => {
    for (const s of KODA_FRAME_CHAIN_SENARYOLARI) {
      const [x, y, z] = s.beklenenDunyaNoktasi;
      const stdout = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
      expect(evaluateFrameChainSenaryo(s, { error: null, stdout }).gecti).toBe(true);
    }
  });

  it("negatif: yakalanmamış hata her zaman başarısızdır", () => {
    expect(evaluateFrameChainSenaryo(senaryo("gorunur"), { error: "SyntaxError: ...", stdout: "" }).gecti).toBe(false);
  });

  it("negatif: çıktı formatı yanlışsa (ör. print unutulmuşsa) başarısız", () => {
    expect(evaluateFrameChainSenaryo(senaryo("gorunur"), { error: null, stdout: "" }).gecti).toBe(false);
  });

  it("negatif: BUG düzeltilmemiş (sıra ters) çözümün ürettiği yanlış nokta görünür senaryoda başarısız olur", () => {
    // rotz(θ)·translation yerine translation·rotz(θ) olması gerekirken tersi yazılmış çözümün ürettiği nokta.
    const s = senaryo("gorunur");
    const yanlisSira = multiply(rotationZ(s.tabanAciRad), translation(s.tabanX, s.tabanY, 0));
    const yanlisNokta = transformPoint(yanlisSira, { x: s.noktaX, y: s.noktaY, z: s.noktaZ });
    const stdout = `${yanlisNokta.x.toFixed(6)},${yanlisNokta.y.toFixed(6)},${yanlisNokta.z.toFixed(6)}`;
    expect(evaluateFrameChainSenaryo(s, { error: null, stdout }).gecti).toBe(false);
  });

  it("negatif (kör transfer koruması): görünür sonucu SABİT SAYI olarak yazdıran çözüm gizli senaryoda başarısız olur", () => {
    const gorunur = senaryo("gorunur");
    const [x, y, z] = gorunur.beklenenDunyaNoktasi;
    const ezberlenenStdout = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
    expect(evaluateFrameChainSenaryo(senaryo("gizli-transfer"), { error: null, stdout: ezberlenenStdout }).gecti).toBe(false);
  });
});
