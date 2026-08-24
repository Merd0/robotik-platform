import { describe, expect, it } from "vitest";
import { inverseKinematicsAnalytical2Dof } from "./robotics/kinematics";
import { genericTwoDofRobot } from "./robotics/robots/genericTwoDof";
import {
  buildKodaTransferCode,
  buildKodaTransferPreamble,
  evaluateKodaTransferSenaryo,
  KODA_TRANSFER_SENARYOLARI,
  type KodaTransferSenaryo,
} from "./kodaTransferGate";

function senaryo(id: string): KodaTransferSenaryo {
  const bulunan = KODA_TRANSFER_SENARYOLARI.find((s) => s.id === id);
  if (!bulunan) throw new Error(`Senaryo bulunamadı: ${id}`);
  return bulunan;
}

describe("KODA_TRANSFER_SENARYOLARI — fixture sağlığı", () => {
  it("bir görünür, bir gizli senaryo var", () => {
    expect(KODA_TRANSFER_SENARYOLARI).toHaveLength(2);
    expect(KODA_TRANSFER_SENARYOLARI.filter((s) => s.gizli)).toHaveLength(1);
    expect(KODA_TRANSFER_SENARYOLARI.filter((s) => !s.gizli)).toHaveLength(1);
  });

  it("her senaryonun beklenenSonAcilarDeg değeri, bağımsız analitik IK'dan (oracle) türetildi", () => {
    // Golden değerler bu dosyanın kendisinden DEĞİL, kinematics.ts'in
    // ayrı, zaten test edilmiş `inverseKinematicsAnalytical2Dof`
    // fonksiyonundan (elbow="up", worker'ın kullandığı varsayılan) türetilir.
    for (const s of KODA_TRANSFER_SENARYOLARI) {
      const angles = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, s.hedef2);
      expect(angles).not.toBeNull();
      const [beklenen1, beklenen2] = s.beklenenSonAcilarDeg;
      expect((angles![0] * 180) / Math.PI).toBeCloseTo(beklenen1, 2);
      expect((angles![1] * 180) / Math.PI).toBeCloseTo(beklenen2, 2);
    }
  });

  it("her senaryonun her iki hedefi de generic-2dof'un erişim alanında (0.2–1.8 m)", () => {
    for (const s of KODA_TRANSFER_SENARYOLARI) {
      for (const hedef of [s.hedef1, s.hedef2]) {
        const mesafe = Math.hypot(hedef.x, hedef.y);
        expect(mesafe).toBeGreaterThanOrEqual(0.2);
        expect(mesafe).toBeLessThanOrEqual(1.8);
      }
    }
  });
});

describe("buildKodaTransferPreamble / buildKodaTransferCode", () => {
  it("dört hedef koordinatını Python float değişkeni olarak enjekte eder", () => {
    const preamble = buildKodaTransferPreamble(senaryo("gorunur"));
    expect(preamble).toContain("HEDEF_X1 = 0.9");
    expect(preamble).toContain("HEDEF_Y1 = 0.3");
    expect(preamble).toContain("HEDEF_X2 = -0.5");
    expect(preamble).toContain("HEDEF_Y2 = 0.8");
  });

  it("önek ile öğrenci kodunu birleştirir", () => {
    const kod = buildKodaTransferCode(senaryo("gorunur"), "print('merhaba')");
    expect(kod.endsWith("print('merhaba')")).toBe(true);
    expect(kod).toContain("HEDEF_X1");
  });
});

describe("evaluateKodaTransferSenaryo — golden + negatif", () => {
  it("golden: doğru fonksiyonu (parametreleri kullanan) çözüm her iki senaryoyu da geçer", () => {
    for (const s of KODA_TRANSFER_SENARYOLARI) {
      const beklenenRad = s.beklenenSonAcilarDeg.map((deg) => (deg * Math.PI) / 180);
      const sonuc = evaluateKodaTransferSenaryo(s, { error: null, jointTrace: [[0, 0], beklenenRad] });
      expect(sonuc.gecti).toBe(true);
    }
  });

  it("negatif: yakalanmamış hata her zaman başarısızdır", () => {
    const sonuc = evaluateKodaTransferSenaryo(senaryo("gorunur"), { error: "RobotHatasi: patladı", jointTrace: [] });
    expect(sonuc.gecti).toBe(false);
  });

  it("negatif: hiç hareket etmemiş (boş jointTrace) çözüm geçmez", () => {
    const sonuc = evaluateKodaTransferSenaryo(senaryo("gorunur"), { error: null, jointTrace: [] });
    expect(sonuc.gecti).toBe(false);
  });

  it("negatif: BUG'ı düzeltmeyen (ikinci hedefin y'sini birinciyle karıştıran) çözüm görünür senaryoda başarısız olur", () => {
    // Öğrencinin düzeltmediği kod: robot.hedefe_git(x2, y1) — beklenen y2 değil y1.
    const buggyHedef = { x: senaryo("gorunur").hedef2.x, y: senaryo("gorunur").hedef1.y };
    const angles = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, buggyHedef)!;
    const sonuc = evaluateKodaTransferSenaryo(senaryo("gorunur"), { error: null, jointTrace: [angles] });
    expect(sonuc.gecti).toBe(false);
  });

  it("negatif (kör transfer koruması): görünür hedefi SABİT SAYI olarak yazan (ezberleyen) çözüm gizli senaryoda başarısız olur", () => {
    // "Ezberleyen" çözüm: parametreleri kullanmak yerine hep görünür
    // senaryonun hedef2'sine gider — gizli senaryoda farklı bir hedef
    // beklenir, bu yüzden eşleşmez.
    const ezberlenenAcilar = inverseKinematicsAnalytical2Dof(genericTwoDofRobot, senaryo("gorunur").hedef2)!;
    const sonuc = evaluateKodaTransferSenaryo(senaryo("gizli-transfer"), { error: null, jointTrace: [ezberlenenAcilar] });
    expect(sonuc.gecti).toBe(false);
  });
});
