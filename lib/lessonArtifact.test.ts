import { describe, expect, it } from "vitest";
import { getAllLessons, type DersFrontmatter } from "./content";
import {
  computeLessonSubjectHashes,
  computePresentationHash,
  computeSourceHash,
  computeTeachingHash,
  findUnpartitionedFrontmatterKeys,
  PRESENTATION_FIELDS,
  SOURCE_FIELDS,
  TEACHING_FIELDS,
} from "./lessonArtifact";

const frontmatter: DersFrontmatter = {
  id: "test-dersi",
  baslik: "Test dersi",
  hat: "a-temeller",
  seviye: "lise",
  sure: 10,
  onkosul: [],
  kazanimlar: ["Bir sonucu gözlemleme"],
  kaynaklar: [{ kind: "book", title: "Modern Robotics, Bölüm 4" }],
  etkilesimli: [],
  durum: "inceleme",
};
const body = "## Kanca\n\nDeney.\n";
const lesson = { frontmatter, body };

describe("ders sürüm kökleri", () => {
  it("satır sonlarını kanonikleştirir", () => {
    expect(computeTeachingHash({ frontmatter, body: "## Kanca\r\n\r\nDeney.\r\n" })).toBe(computeTeachingHash(lesson));
  });

  it("öğrencinin gördüğü metin değişince teachingHash değişir", () => {
    expect(computeTeachingHash({ frontmatter, body: "Değişen metin" })).not.toBe(computeTeachingHash(lesson));
  });

  it("yayına almak hiçbir inceleme kökünü değiştirmez", () => {
    // Yayına alma paradoksunun regresyon testi: v1'de `durum` tek artifact
    // hash'inin içindeydi, bu yüzden incelenen bir taslak yayına alındığı anda
    // makbuzu geçersiz oluyordu.
    const yayinda = { frontmatter: { ...frontmatter, durum: "yayinda" as const }, body };
    expect(computeSourceHash(yayinda)).toBe(computeSourceHash(lesson));
    expect(computeTeachingHash(yayinda)).toBe(computeTeachingHash(lesson));
    expect(computePresentationHash(yayinda)).not.toBe(computePresentationHash(lesson));
  });

  it("legacy inceleme alanları ve süre yalnız sunum kökünü etkiler", () => {
    const duzenli = {
      frontmatter: { ...frontmatter, sure: 25, incelendi_tarafindan: "A", incelendi_tarih: "2026-08-01" },
      body,
    };
    expect(computeTeachingHash(duzenli)).toBe(computeTeachingHash(lesson));
    expect(computeSourceHash(duzenli)).toBe(computeSourceHash(lesson));
  });

  it("kaynak tazelemesi ders metni incelemesini eskitmez", () => {
    const tazelenmis = {
      frontmatter: {
        ...frontmatter,
        kaynaklar: [{ kind: "official-doc" as const, title: "Meca500", url: "https://example.org", accessedAt: "2026-08-09" }],
      },
      body,
    };
    expect(computeSourceHash(tazelenmis)).not.toBe(computeSourceHash(lesson));
    expect(computeTeachingHash(tazelenmis)).toBe(computeTeachingHash(lesson));
  });

  it("üç kök birbirinden bağımsız ve revisionRoot hepsini kapsar", () => {
    const hashes = computeLessonSubjectHashes(lesson);
    const hepsi = [hashes.sourceHash, hashes.teachingHash, hashes.presentationHash, hashes.revisionRoot];
    expect(new Set(hepsi).size).toBe(4);
    for (const hash of hepsi) expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    const degisen = computeLessonSubjectHashes({ frontmatter: { ...frontmatter, sure: 99 }, body });
    expect(degisen.revisionRoot).not.toBe(hashes.revisionRoot);
  });

  it("alan bölümlemesi ayrık", () => {
    const buckets = [SOURCE_FIELDS, TEACHING_FIELDS, PRESENTATION_FIELDS].flat();
    expect(new Set(buckets).size).toBe(buckets.length);
  });

  it("hiçbir dersin frontmatter alanı kapsam dışı kalmaz", () => {
    // Yeni bir frontmatter alanı eklendiğinde hangi inceleme kapsamını
    // eskiteceği bilinçli seçilmeli; sessizce kapsam dışı kalmamalı.
    for (const lesson of getAllLessons()) {
      expect(findUnpartitionedFrontmatterKeys(lesson.frontmatter), lesson.slug).toEqual([]);
    }
  });
});
