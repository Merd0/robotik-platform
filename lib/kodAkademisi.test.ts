import { describe, expect, it } from "vitest";
import { EVIDENCE_PREDICATES } from "./evidence";
import { getAdjacentModules, getPublicModuleBySlug, getPublicModules, getPublicModulesByAsama } from "./kodAkademisi";

describe("Kod Akademisi içerik yükleyicisi", () => {
  it("Temel aşamadaki 3 dikey dilim modülünü sıra ile döndürür", () => {
    const modules = getPublicModulesByAsama("temel");
    expect(modules.map((module) => module.slug)).toEqual([
      "koda-temel-ilk-calistirma",
      "koda-temel-degisken-degistir",
      "koda-temel-parametre-gonder",
    ]);
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

  it("son modülün sonraki komşusu yok", () => {
    const son = getPublicModuleBySlug("koda-temel-parametre-gonder")!;
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
});
