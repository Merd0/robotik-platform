import { describe, expect, it } from "vitest";
import { EVIDENCE_PREDICATES } from "./evidence";
import { getAdjacentModules, getPublicModuleBySlug, getPublicModules, getPublicModulesByAsama } from "./kodAkademisi";

describe("Kod Akademisi içerik yükleyicisi", () => {
  it("Temel aşamadaki 4 modülü sıra ile döndürür (dikey dilim + açıkla-sonra-uygula)", () => {
    const modules = getPublicModulesByAsama("temel");
    expect(modules.map((module) => module.slug)).toEqual([
      "koda-temel-ilk-calistirma",
      "koda-temel-degisken-degistir",
      "koda-temel-parametre-gonder",
      "koda-temel-acikla-sonra-uygula",
    ]);
  });

  it("Orta aşamadaki hata avcılığı modülünü döndürür", () => {
    const modules = getPublicModulesByAsama("orta");
    expect(modules.map((module) => module.slug)).toEqual(["koda-orta-hata-avcisi"]);
  });

  it("slug ile tek bir modülü bulur", () => {
    const found = getPublicModuleBySlug("koda-temel-ilk-calistirma");
    expect(found?.frontmatter.baslik).toBe("İlk çalıştırma");
    expect(found?.frontmatter.robot).toBe("generic-2dof");
  });

  it("bilinmeyen slug undefined döner", () => {
    expect(getPublicModuleBySlug("olmayan-modul")).toBeUndefined();
  });

  it("ilk modülün önceki komşusu yok, sonraki komşusu var", () => {
    const ilk = getPublicModuleBySlug("koda-temel-ilk-calistirma")!;
    const { previous, next } = getAdjacentModules(ilk);
    expect(previous).toBeNull();
    expect(next?.slug).toBe("koda-temel-degisken-degistir");
  });

  it("Temel'in yeni son modülü (açıkla-sonra-uygula) sonraki komşusu yok, öncekine parametre-gönder bağlı", () => {
    const uctuncu = getPublicModuleBySlug("koda-temel-parametre-gonder")!;
    expect(getAdjacentModules(uctuncu).next?.slug).toBe("koda-temel-acikla-sonra-uygula");

    const son = getPublicModuleBySlug("koda-temel-acikla-sonra-uygula")!;
    const { next } = getAdjacentModules(son);
    expect(next).toBeNull();
  });

  it("gözlem tipi ilk modül otomatik test istemez (expectedFinalDegrees yok)", () => {
    const found = getPublicModuleBySlug("koda-temel-ilk-calistirma")!;
    expect(found.frontmatter.expectedFinalDegrees).toBeUndefined();
  });

  it("değiştir/tamamla tipi modüller davranışsal doğrulama için expectedFinalDegrees taşır", () => {
    const degistir = getPublicModuleBySlug("koda-temel-degisken-degistir")!;
    const tamamla = getPublicModuleBySlug("koda-temel-parametre-gonder")!;
    expect(degistir.frontmatter.expectedFinalDegrees).toEqual([60, -45]);
    expect(tamamla.frontmatter.expectedFinalDegrees).toEqual([45, -30]);
  });

  it("her davranışsal modülün lib/evidence.ts'te bağlı bir predicate'i var", () => {
    const degistir = getPublicModuleBySlug("koda-temel-degisken-degistir")!;
    const tamamla = getPublicModuleBySlug("koda-temel-parametre-gonder")!;
    expect(EVIDENCE_PREDICATES.some((predicate) => predicate.lessonId === degistir.slug)).toBe(true);
    expect(EVIDENCE_PREDICATES.some((predicate) => predicate.lessonId === tamamla.slug)).toBe(true);
  });

  it("tüm herkese açık modüller ipuclari alanında tam olarak 3 ipucu taşır", () => {
    for (const found of getPublicModules()) {
      expect(found.frontmatter.ipuclari, found.slug).toHaveLength(3);
    }
  });

  it("açıkla-sonra-uygula modülü boş bir başlangıç kodu ve davranışsal hedef taşır", () => {
    const found = getPublicModuleBySlug("koda-temel-acikla-sonra-uygula")!;
    expect(found.frontmatter.initialCode.trim()).not.toContain("robot.movej");
    expect(found.frontmatter.expectedFinalDegrees).toEqual([90, -60]);
    expect(EVIDENCE_PREDICATES.some((predicate) => predicate.lessonId === found.slug)).toBe(true);
  });

  it("hata avcılığı modülünün başlangıç kodu bilerek bozuk (eksik parametre)", () => {
    const found = getPublicModuleBySlug("koda-orta-hata-avcisi")!;
    // Bozukluk: aci_2 tanımlı ama movej()'in listesinde kullanılmamış —
    // string eşleşmesiyle DEĞİL, davranışsal predicate'le doğrulanır (aşağıdaki test).
    expect(found.frontmatter.initialCode).toContain("aci_2");
    expect(found.frontmatter.initialCode).toMatch(/robot\.movej\(\[aci_1\]\)/);
    expect(found.frontmatter.expectedFinalDegrees).toEqual([90, -45]);
    expect(EVIDENCE_PREDICATES.some((predicate) => predicate.lessonId === found.slug)).toBe(true);
  });

  it("hata avcılığı modülü gövdesinde modül sonu 'neden' Quiz sorusu var", () => {
    const found = getPublicModuleBySlug("koda-orta-hata-avcisi")!;
    expect(found.body).toContain("<Quiz");
    expect(found.body).toContain("soru:");
  });
});
