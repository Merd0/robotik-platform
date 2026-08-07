import { describe, expect, it } from "vitest";
import { karistir, karistirmaSirasi } from "./quiz";

describe("karistirmaSirasi", () => {
  it("geçerli bir permütasyon üretir (her index tam bir kez)", () => {
    for (const uzunluk of [2, 3, 4, 5]) {
      const sira = karistirmaSirasi("örnek soru", uzunluk);
      expect([...sira].sort((a, b) => a - b)).toEqual(
        Array.from({ length: uzunluk }, (_, i) => i),
      );
    }
  });

  it("kararlı: aynı anahtar her zaman aynı sırayı verir", () => {
    const a = karistirmaSirasi("Robot nasıl görür?", 3);
    const b = karistirmaSirasi("Robot nasıl görür?", 3);
    expect(a).toEqual(b);
  });

  it("farklı anahtarlar genelde farklı sıra verir", () => {
    const sonuclar = new Set(
      ["soru bir", "soru iki", "soru üç", "soru dört", "soru beş"].map((k) =>
        karistirmaSirasi(k, 3).join(","),
      ),
    );
    expect(sonuclar.size).toBeGreaterThan(1);
  });
});

describe("karistir", () => {
  it("doğru şıkkın metnini korur, index'ini günceller", () => {
    const secenekler = ["yanlış A", "DOĞRU", "yanlış B"];
    const sonuc = karistir(secenekler, 1, "bir soru metni");
    expect(sonuc.secenekler[sonuc.dogru]).toBe("DOĞRU");
    expect([...sonuc.secenekler].sort()).toEqual([...secenekler].sort());
  });

  it("iki şıklı soruda da çalışır", () => {
    const sonuc = karistir(["evet", "hayır"], 0, "ikili soru");
    expect(sonuc.secenekler[sonuc.dogru]).toBe("evet");
  });

  it("konum yanlılığını dağıtır: hepsi index 1 olan sorular tek konumda toplanmaz", () => {
    // Gerçek içeriğin sorunu buydu: 139 sorunun %89'unda dogru = 1.
    const dagilim = new Map<number, number>();
    for (let i = 0; i < 300; i++) {
      const { dogru } = karistir(["a", "b", "c"], 1, `soru numarası ${i}`);
      dagilim.set(dogru, (dagilim.get(dogru) ?? 0) + 1);
    }
    const enYuksek = Math.max(...dagilim.values());
    expect(enYuksek / 300).toBeLessThan(0.5);
    expect(dagilim.size).toBe(3);
  });
});
