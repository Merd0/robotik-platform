import { describe, expect, it } from "vitest";
import { getAllLessons, type DersDurum, type DersFrontmatter, type SourceRef } from "./content";
import { computeLessonSubjectHashes } from "./lessonArtifact";
import { reviewDebt, reviewDebtBaseline, getOpenReviewDebtIds } from "./reviewDebt";
import {
  findLegacyTextSources,
  getLessonReviewStatus,
  getRequiredReviewScopes,
  requiresStructuredSources,
  reviewReceipts,
  SCOPE_SUBJECT_KEYS,
} from "./reviewReceipts";

describe("Review Receipt v2", () => {
  it("insan doğrulaması yokken makbuz uydurmaz", () => {
    expect(reviewReceipts.receipts).toEqual([]);
    const lesson = getAllLessons().find((candidate) => candidate.slug === "b-universite-jacobian");
    expect(lesson).toBeDefined();
    const status = getLessonReviewStatus(lesson!);
    expect(status.state).toBe("stale-after-content-change");
    expect(status.verifiedScopes).toEqual([]);
    expect(status.scopeStatuses.every((scope) => scope.state === "missing")).toBe(true);
  });

  it("güvenlik hattına ayrı safety review kapsamı zorunlu tutar", () => {
    const safetyLesson = getAllLessons().find((lesson) => lesson.frontmatter.hat === "h-guvenlik");
    const regularLesson = getAllLessons().find((lesson) => lesson.frontmatter.hat === "a-temeller");
    expect(getRequiredReviewScopes(safetyLesson!)).toContain("safety");
    expect(getRequiredReviewScopes(regularLesson!)).not.toContain("safety");
  });

  it("her kapsam yalnız bağlı olduğu köke bakar", () => {
    expect(SCOPE_SUBJECT_KEYS.source).toEqual(["sourceHash"]);
    expect(SCOPE_SUBJECT_KEYS.pedagogical).toEqual(["teachingHash"]);
    expect(SCOPE_SUBJECT_KEYS.technical).toContain("sourceHash");
    expect(SCOPE_SUBJECT_KEYS.technical).toContain("teachingHash");
    // presentationHash hiçbir kapsamda olmamalı: yayına almak insan
    // incelemesini geçersiz kılmaz.
    for (const keys of Object.values(SCOPE_SUBJECT_KEYS)) {
      expect(keys).not.toContain("presentationHash");
    }
  });

  it("makbuz kökleri gerçekten hesaplanan köklerle aynı biçimde", () => {
    const lesson = getAllLessons()[0];
    const hashes = computeLessonSubjectHashes(lesson);
    expect(hashes.sourceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(hashes.teachingHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

describe("yapılandırılmış kaynak zorunluluğu", () => {
  const ders = (durum: DersDurum, kaynaklar: Array<string | SourceRef>): { frontmatter: DersFrontmatter } => ({
    frontmatter: {
      id: "test",
      baslik: "T",
      hat: "a-temeller",
      seviye: "lise",
      sure: 10,
      onkosul: [],
      kazanimlar: [],
      etkilesimli: [],
      durum,
      kaynaklar,
    },
  });

  it("zaten yayında olan ders, --yayinla verilmese de kurala tabidir", () => {
    // Regresyon: onay dersi legacy borçtan düşürür, düşer düşmez CI
    // yapılandırılmış kaynak ister. Kontrol yalnız --yayinla'ya bakarsa,
    // onaydan hemen sonra build kırılır.
    expect(requiresStructuredSources(ders("yayinda", ["düz metin"]), { yayinaAliniyor: false })).toBe(true);
  });

  it("bu çağrıda yayına alınan taslak da kurala tabidir", () => {
    expect(requiresStructuredSources(ders("taslak", ["düz metin"]), { yayinaAliniyor: true })).toBe(true);
  });

  it("yayına alınmayan taslak kurala tabi değildir", () => {
    expect(requiresStructuredSources(ders("taslak", ["düz metin"]), { yayinaAliniyor: false })).toBe(false);
    expect(requiresStructuredSources(ders("inceleme", ["düz metin"]), { yayinaAliniyor: false })).toBe(false);
  });

  it("düz metin kaynakları ayıklar, SourceRef'lere dokunmaz", () => {
    const karisik = ders("yayinda", [
      "düz metin kaynak",
      { kind: "book", title: "Modern Robotics" },
      "ikinci düz metin",
    ]);
    expect(findLegacyTextSources(karisik)).toEqual(["düz metin kaynak", "ikinci düz metin"]);
    expect(findLegacyTextSources(ders("yayinda", [{ kind: "book", title: "X" }]))).toEqual([]);
  });
});

describe("review borcu baseline'ı", () => {
  it("güncel borç dondurulmuş baseline'ın alt kümesidir", () => {
    const acik = getOpenReviewDebtIds();
    expect(acik.length).toBeGreaterThan(0);
    for (const id of acik) expect(reviewDebtBaseline.has(id)).toBe(true);
  });

  it("baseline 39 derslik dondurulmuş küme", () => {
    expect(reviewDebt.baselineIds).toHaveLength(39);
    expect(reviewDebt.schemaVersion).toBe(2);
  });

  it("bir ders iki borç listesinde birden bulunmaz", () => {
    const kesisim = reviewDebt.staleAfterContentChange.filter((id) => reviewDebt.legacyUnverified.includes(id));
    expect(kesisim).toEqual([]);
  });
});
