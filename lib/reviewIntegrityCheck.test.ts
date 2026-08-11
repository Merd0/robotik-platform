import { describe, expect, it } from "vitest";
import type { LessonSubjectHashes } from "./lessonArtifact";
import type { ReviewReceipt } from "./reviewReceipts";
import {
  checkAppendOnlyReceipts,
  checkReceiptsSchema,
  validateReceiptShape,
  verifyReceiptSubjectHashes,
} from "./reviewIntegrityCheck";

const validHash = (seed: string) => `sha256:${seed.repeat(64).slice(0, 64)}`;
const validCommit = (seed: string) => seed.repeat(40).slice(0, 40);

function baseReceipt(overrides: Partial<ReviewReceipt> = {}): ReviewReceipt {
  return {
    id: "r-1",
    lessonId: "b-lise-ileri-kinematik",
    scope: "source",
    decision: "approved",
    subject: { sourceHash: validHash("a") },
    sourceCommit: validCommit("a"),
    reviewedAt: "2026-08-09",
    reviewer: { displayName: "Mert", role: "maintainer" },
    ...overrides,
  };
}

const knownLessons = new Set(["b-lise-ileri-kinematik"]);

describe("checkReceiptsSchema", () => {
  it("Review Receipt v2 şemasını kabul eder", () => {
    expect(checkReceiptsSchema({ schemaVersion: 2, hashAlgorithm: "sha256", canonicalization: "lesson-artifact-v2" })).toEqual([]);
  });

  it("yanlış şemayı reddeder", () => {
    expect(checkReceiptsSchema({ schemaVersion: 1, hashAlgorithm: "sha256", canonicalization: "lesson-artifact-v2" })).toHaveLength(1);
  });
});

describe("validateReceiptShape — makbuz yokluğu asla fatal değil, yalnız VAR OLAN makbuz denetlenir", () => {
  it("geçerli bir makbuzda hata üretmez", () => {
    expect(validateReceiptShape(baseReceipt(), knownLessons, new Set())).toEqual([]);
  });

  it("boş makbuz listesi -- eksik inceleme -- hiçbir hata üretmez", () => {
    // Bu, "makbuz yokluğu yalnız raporlanır" ilkesinin integrity kanalındaki
    // karşılığı: bir dersin hiç makbuzu olmaması bu fonksiyonun hiç
    // çağrılmaması demektir, dolayısıyla sıfır hata üretir.
    const seenIds = new Set<string>();
    const errors = ([] as ReviewReceipt[]).flatMap((receipt) => validateReceiptShape(receipt, knownLessons, seenIds));
    expect(errors).toEqual([]);
  });

  it("bilinmeyen lessonId'yi reddeder", () => {
    expect(validateReceiptShape(baseReceipt({ lessonId: "olmayan-ders" }), knownLessons, new Set())).toHaveLength(1);
  });

  it("yinelenen id'yi reddeder", () => {
    const seenIds = new Set<string>();
    expect(validateReceiptShape(baseReceipt(), knownLessons, seenIds)).toEqual([]);
    expect(validateReceiptShape(baseReceipt(), knownLessons, seenIds).length).toBeGreaterThan(0);
  });

  it("safety kapsamını yalnız safety-sme rolüne izin verir", () => {
    const errors = validateReceiptShape(
      baseReceipt({ id: "r-2", scope: "safety", subject: { sourceHash: validHash("a"), teachingHash: validHash("b") }, reviewer: { displayName: "Mert", role: "maintainer" } }),
      knownLessons,
      new Set(),
    );
    expect(errors.some((error) => error.includes("safety-sme"))).toBe(true);
  });

  it("biçimsiz subject hash'ini reddeder (uydurma ama kısa bir değer)", () => {
    const errors = validateReceiptShape(baseReceipt({ subject: { sourceHash: "uydurma-hash" } }), knownLessons, new Set());
    expect(errors.some((error) => error.includes("sha256 biçiminde"))).toBe(true);
  });

  it("kapsam dışı subject anahtarını reddeder", () => {
    const errors = validateReceiptShape(
      baseReceipt({ subject: { sourceHash: validHash("a"), teachingHash: validHash("b") } }),
      knownLessons,
      new Set(),
    );
    expect(errors.some((error) => error.includes("taşıyamaz"))).toBe(true);
  });
});

describe("verifyReceiptSubjectHashes — tahrif edilmiş makbuz her zaman fatal", () => {
  const computed: LessonSubjectHashes = {
    sourceHash: validHash("real"),
    teachingHash: validHash("teach"),
    presentationHash: validHash("pres"),
    revisionRoot: validHash("root"),
  };

  it("gerçek dersle eşleşen hash'i onaylar", () => {
    expect(verifyReceiptSubjectHashes(baseReceipt({ subject: { sourceHash: computed.sourceHash } }), computed)).toEqual([]);
  });

  it("tahrif edilmiş (yanlış) hash'i reddeder", () => {
    const tampered = baseReceipt({ subject: { sourceHash: validHash("uydurma") } });
    const errors = verifyReceiptSubjectHashes(tampered, computed);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("eşleşmiyor");
  });
});

describe("checkAppendOnlyReceipts — var olan makbuz sessizce değiştirilemez veya silinemez", () => {
  it("değişmeyen makbuzlarda hata üretmez", () => {
    const receipts = [baseReceipt()];
    expect(checkAppendOnlyReceipts(receipts, receipts)).toEqual([]);
  });

  it("silinen makbuzu reddeder", () => {
    expect(checkAppendOnlyReceipts([baseReceipt()], [])).toHaveLength(1);
  });

  it("değiştirilen makbuzu reddeder", () => {
    const previous = [baseReceipt()];
    const current = [baseReceipt({ decision: "changes-requested" })];
    expect(checkAppendOnlyReceipts(previous, current)).toHaveLength(1);
  });

  it("yeni eklenen makbuzda hata üretmez (append hâlâ serbest)", () => {
    const previous = [baseReceipt()];
    const current = [baseReceipt(), baseReceipt({ id: "r-2" })];
    expect(checkAppendOnlyReceipts(previous, current)).toEqual([]);
  });
});
