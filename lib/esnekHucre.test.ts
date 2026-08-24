import { describe, expect, it } from "vitest";
import {
  buildEsnekHucreCode,
  buildEsnekHucrePreamble,
  ESNEK_HUCRE_SENARYOLARI,
  evaluateEsnekHucreSenaryo,
  GECERLI_PARCA_TURLERI,
  parseDurumGecmisi,
  parseHatalar,
  type EsnekHucreCalismaSonucu,
  type EsnekHucreSenaryo,
} from "./esnekHucre";

function senaryo(id: string): EsnekHucreSenaryo {
  const bulunan = ESNEK_HUCRE_SENARYOLARI.find((s) => s.id === id);
  if (!bulunan) throw new Error(`Senaryo bulunamadı: ${id}`);
  return bulunan;
}

describe("ESNEK_HUCRE_SENARYOLARI — fixture sağlığı", () => {
  it("tam 5 senaryo var: 3 görünür + 2 gizli", () => {
    expect(ESNEK_HUCRE_SENARYOLARI).toHaveLength(5);
    expect(ESNEK_HUCRE_SENARYOLARI.filter((s) => !s.gizli)).toHaveLength(3);
    expect(ESNEK_HUCRE_SENARYOLARI.filter((s) => s.gizli)).toHaveLength(2);
  });

  it("id'ler tekil", () => {
    const idler = ESNEK_HUCRE_SENARYOLARI.map((s) => s.id);
    expect(new Set(idler).size).toBe(idler.length);
  });

  it("geçersiz-parça senaryosu GECERLI_PARCA_TURLERI dışında bir tür kullanıyor", () => {
    expect(GECERLI_PARCA_TURLERI).not.toContain(senaryo("gorev-2-gecersiz-parca").isEmri.parcaTuru);
  });

  it("diğer tüm senaryolar geçerli parça türü kullanıyor", () => {
    for (const s of ESNEK_HUCRE_SENARYOLARI) {
      if (s.id === "gorev-2-gecersiz-parca") continue;
      expect(GECERLI_PARCA_TURLERI).toContain(s.isEmri.parcaTuru);
    }
  });
});

describe("buildEsnekHucrePreamble", () => {
  it("sensör onayını doğru Python boolean'ına çevirir", () => {
    expect(buildEsnekHucrePreamble(senaryo("gorev-1-normal"))).toContain("Hucre(True)");
    expect(buildEsnekHucrePreamble(senaryo("gorev-3-onay-gelmiyor"))).toContain("Hucre(False)");
  });

  it("iş emrini geçerli bir Python sözlük literaline çevirir", () => {
    const preamble = buildEsnekHucrePreamble(senaryo("gorev-1-normal"));
    expect(preamble).toContain('"parca_turu": "kutu"');
    expect(preamble).toContain('"x": 0.5, "y": 0.5, "z": 0.0');
  });

  it("buildEsnekHucreCode, önekle öğrenci kodunu birleştirir", () => {
    const kod = buildEsnekHucreCode(senaryo("gorev-1-normal"), "print('merhaba')");
    expect(kod.endsWith("print('merhaba')")).toBe(true);
    expect(kod).toContain("class Hucre:");
  });
});

describe("parseDurumGecmisi / parseHatalar", () => {
  it("DURUM: ve HATA: satırlarını sırayla çıkarır, diğer satırları yok sayar", () => {
    const stdout = "başladı\nDURUM:ready\nbir şeyler oldu\nDURUM:running\nHATA:sensor-zaman-asimi\nDURUM:fault\n";
    expect(parseDurumGecmisi(stdout)).toEqual(["ready", "running", "fault"]);
    expect(parseHatalar(stdout)).toEqual(["sensor-zaman-asimi"]);
  });

  it("boş stdout için boş dizi döner", () => {
    expect(parseDurumGecmisi("")).toEqual([]);
    expect(parseHatalar("")).toEqual([]);
  });
});

describe("evaluateEsnekHucreSenaryo — golden: iyi yazılmış bir referans çözüm", () => {
  it("gorev-1-normal: her iki hedefe de hareket edip tamamlandı diyen çözüm geçer", () => {
    const sonuc: EsnekHucreCalismaSonucu = {
      stdout: "DURUM:ready\nDURUM:running\nDURUM:tamamlandi\n",
      error: null,
      jointTrace: [[0.1, 0.2], [0.3, 0.4]],
    };
    const degerlendirme = evaluateEsnekHucreSenaryo(senaryo("gorev-1-normal"), sonuc);
    expect(degerlendirme.gecti).toBe(true);
  });

  it("gorev-2-gecersiz-parca: hareket etmeden reddeden çözüm geçer", () => {
    const sonuc: EsnekHucreCalismaSonucu = { stdout: "DURUM:reddedildi\n", error: null, jointTrace: [] };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-2-gecersiz-parca"), sonuc).gecti).toBe(true);
  });

  it("gorev-3-onay-gelmiyor: hatayı bildirip fault'ta kalan çözüm geçer", () => {
    const sonuc: EsnekHucreCalismaSonucu = {
      stdout: "DURUM:ready\nHATA:sensor-onayi-gelmedi\nDURUM:fault\n",
      error: null,
      jointTrace: [],
    };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-3-onay-gelmiyor"), sonuc).gecti).toBe(true);
  });

  it("gorev-4-erisilemeyen-hedef: ilk hedefe gidip ikincide hatayı yakalayan çözüm geçer", () => {
    const sonuc: EsnekHucreCalismaSonucu = {
      stdout: "DURUM:ready\nDURUM:running\nHATA:hedefe-ulasilamadi\nDURUM:fault\n",
      error: null,
      jointTrace: [[0.1, 0.2]],
    };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-4-erisilemeyen-hedef"), sonuc).gecti).toBe(true);
  });

  it("gorev-5-transfer: üç farklı hedefe de giden çözüm geçer (genelleme kanıtı)", () => {
    const sonuc: EsnekHucreCalismaSonucu = {
      stdout: "DURUM:ready\nDURUM:running\nDURUM:tamamlandi\n",
      error: null,
      jointTrace: [[0.1, 0.1], [0.2, 0.2], [0.3, 0.3]],
    };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-5-transfer"), sonuc).gecti).toBe(true);
  });
});

describe("evaluateEsnekHucreSenaryo — negatif: her başarı senaryosunun karşılığı", () => {
  it("yakalanmamış Python istisnası HER ZAMAN başarısızdır, senaryo ne olursa olsun", () => {
    const sonuc: EsnekHucreCalismaSonucu = { stdout: "DURUM:tamamlandi\n", error: "RobotHatasi: patladı", jointTrace: [] };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-1-normal"), sonuc).gecti).toBe(false);
  });

  it("gorev-1-normal: eksik hareketle 'tamamlandi' demek geçmez", () => {
    const sonuc: EsnekHucreCalismaSonucu = { stdout: "DURUM:tamamlandi\n", error: null, jointTrace: [[0.1, 0.2]] };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-1-normal"), sonuc).gecti).toBe(false);
  });

  it("gorev-1-normal: hiç DURUM basmadan sadece hareket etmek geçmez", () => {
    const sonuc: EsnekHucreCalismaSonucu = { stdout: "", error: null, jointTrace: [[0.1, 0.2], [0.3, 0.4]] };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-1-normal"), sonuc).gecti).toBe(false);
  });

  it("gorev-2-gecersiz-parca: doğrulamayı atlayıp yine de hareket eden çözüm geçmez", () => {
    const sonuc: EsnekHucreCalismaSonucu = { stdout: "DURUM:ready\nDURUM:running\nDURUM:tamamlandi\n", error: null, jointTrace: [[0.1, 0.2]] };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-2-gecersiz-parca"), sonuc).gecti).toBe(false);
  });

  it("gorev-2-gecersiz-parca: 'reddedildi' demeden sessizce durmak da geçmez", () => {
    const sonuc: EsnekHucreCalismaSonucu = { stdout: "DURUM:ready\n", error: null, jointTrace: [] };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-2-gecersiz-parca"), sonuc).gecti).toBe(false);
  });

  it("gorev-3-onay-gelmiyor: onayı hiç kontrol etmeden 'tamamlandi' demek geçmez", () => {
    const sonuc: EsnekHucreCalismaSonucu = { stdout: "DURUM:ready\nDURUM:running\nDURUM:tamamlandi\n", error: null, jointTrace: [[0.1, 0.2]] };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-3-onay-gelmiyor"), sonuc).gecti).toBe(false);
  });

  it("gorev-3-onay-gelmiyor: HATA bildirmeden sessizce fault'a geçmek de geçmez", () => {
    const sonuc: EsnekHucreCalismaSonucu = { stdout: "DURUM:ready\nDURUM:fault\n", error: null, jointTrace: [] };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-3-onay-gelmiyor"), sonuc).gecti).toBe(false);
  });

  it("gorev-4-erisilemeyen-hedef: istisnayı yakalamayan (worker.error dolu) çözüm geçmez", () => {
    const sonuc: EsnekHucreCalismaSonucu = {
      stdout: "DURUM:ready\nDURUM:running\n",
      error: "RobotHatasi: Hedef (x=5, y=5, z=0) bu robotun çalışma uzayı dışında",
      jointTrace: [[0.1, 0.2]],
    };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-4-erisilemeyen-hedef"), sonuc).gecti).toBe(false);
  });

  it("gorev-4-erisilemeyen-hedef: hatayı yakalayıp yine de 'tamamlandi' demek (yarıda kesilmeyi gizlemek) geçmez", () => {
    const sonuc: EsnekHucreCalismaSonucu = {
      stdout: "DURUM:ready\nDURUM:running\nHATA:hedefe-ulasilamadi\nDURUM:tamamlandi\n",
      error: null,
      jointTrace: [[0.1, 0.2]],
    };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-4-erisilemeyen-hedef"), sonuc).gecti).toBe(false);
  });

  it("gorev-5-transfer: yalnızca eski (2 hedefli) mantığı kopyalayıp üçüncü hedefi atlayan çözüm geçmez", () => {
    const sonuc: EsnekHucreCalismaSonucu = { stdout: "DURUM:ready\nDURUM:running\nDURUM:tamamlandi\n", error: null, jointTrace: [[0.1, 0.1], [0.2, 0.2]] };
    expect(evaluateEsnekHucreSenaryo(senaryo("gorev-5-transfer"), sonuc).gecti).toBe(false);
  });
});
