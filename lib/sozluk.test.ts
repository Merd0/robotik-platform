import { describe, expect, it } from "vitest";
import { getSozluk, getTerimBySlug, terimSlug } from "./sozluk";

describe("sözlük URL'leri", () => {
  it("72 terimin her biri için benzersiz bir statik slug üretir", () => {
    const terimler = getSozluk();
    const sluglar = terimler.map((terim) => terimSlug(terim.tr));

    expect(terimler).toHaveLength(72);
    expect(new Set(sluglar).size).toBe(72);
    expect(sluglar.every(Boolean)).toBe(true);
  });

  it("Türkçe karakterleri okunabilir URL parçalarına dönüştürür", () => {
    expect(terimSlug("Tekillik")).toBe("tekillik");
    expect(terimSlug("ters kinematik")).toBe("ters-kinematik");
    expect(terimSlug("el-göz kalibrasyonu")).toBe("el-goz-kalibrasyonu");
    expect(terimSlug("ölçüm belirsizliği")).toBe("olcum-belirsizligi");
  });

  it("slug üzerinden doğru terimi bulur", () => {
    expect(getTerimBySlug("el-goz-kalibrasyonu")?.en).toBe("hand-eye calibration");
    expect(getTerimBySlug("olmayan-terim")).toBeUndefined();
  });
});
