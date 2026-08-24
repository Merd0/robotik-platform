import { describe, expect, it } from "vitest";
import type { EvidenceEvent } from "./evidence";
import { getContinueState, type ContinueLesson } from "./continueLearning";

function lesson(overrides: Partial<ContinueLesson> & Pick<ContinueLesson, "slug">): ContinueLesson {
  return {
    baslik: overrides.slug,
    seviye: "ortaokul",
    seviyeEtiketi: "Ortaokul",
    hatEtiketi: "Test hattı",
    hatIndex: 0,
    sira: 1,
    onkosul: [],
    ...overrides,
  };
}

const lessons: ContinueLesson[] = [
  lesson({ slug: "m-1", hatIndex: 0, sira: 1 }),
  lesson({ slug: "m-2", hatIndex: 0, sira: 2, onkosul: ["m-1"] }),
  lesson({ slug: "m-3", hatIndex: 1, sira: 1, onkosul: ["m-2"] }),
];

function evidence(lessonId: string, stage: EvidenceEvent["stage"] = "read"): EvidenceEvent {
  return {
    schemaVersion: 2,
    id: `${lessonId}-${stage}`,
    lessonId,
    skillId: "test",
    kind: stage === "passed" ? "achievement" : "observation",
    stage,
    result: "neutral",
    verification: stage === "passed" ? "registry-predicate" : "component-observed",
    contentVersion: "v1",
    createdAt: "2026-08-11T10:00:00.000Z",
  };
}

describe("kaldığın yerden devam durumu", () => {
  it("kayıt yoksa kartı gizlemek için null döndürür", () => {
    expect(getContinueState([], lessons)).toBeNull();
  });

  it("son yayımlı ders kaydını ve müfredat sırasındaki (önkoşulu tamam) sonraki adımı seçer", () => {
    const state = getContinueState([evidence("m-1"), evidence("bilinmeyen"), evidence("m-2", "observed")], lessons);
    expect(state?.lastLesson.slug).toBe("m-2");
    expect(state?.lastEventLabel).toBe("Deney gözlemi kaydedildi");
    expect(state?.recommendation.href).toBe("/ders/m-3");
  });

  it("seviyedeki tüm dersler tamamlandıysa aynı seviyenin ders sayfasını tek adım olarak verir", () => {
    const state = getContinueState(lessons.map((l) => evidence(l.slug)), lessons);
    expect(state?.recommendation.href).toBe("/seviye/ortaokul");
  });

  it("önkoşulu henüz karşılanmayan bir dersi atlayıp önkoşulu tamam olan bir sonraki adaya gider", () => {
    const gapli: ContinueLesson[] = [
      lesson({ slug: "g-1", hatIndex: 0, sira: 1 }),
      lesson({ slug: "g-2", hatIndex: 1, sira: 1, onkosul: ["g-onkosul"] }),
      lesson({ slug: "g-onkosul", hatIndex: 1, sira: 2 }),
      lesson({ slug: "g-3", hatIndex: 2, sira: 1, onkosul: ["g-1"] }),
    ];
    const state = getContinueState([evidence("g-1")], gapli);
    // Müfredat sırasında g-2 önce gelir ama onkosulu (g-onkosul) henüz
    // görülmedi; algoritma onu atlayıp hazır olan g-onkosul'u önerir.
    expect(state?.recommendation.href).toBe("/ders/g-onkosul");
  });

  it("hiçbir aday hazır değilse (döngüsel/karşılıksız önkoşul) müfredat sırasındaki ilk adaya düşer — önerisiz bırakmaz", () => {
    const tikanik: ContinueLesson[] = [
      lesson({ slug: "d-1", hatIndex: 0, sira: 1 }),
      lesson({ slug: "d-2", hatIndex: 0, sira: 2, onkosul: ["d-3"] }),
      lesson({ slug: "d-3", hatIndex: 0, sira: 3, onkosul: ["d-2"] }),
    ];
    const state = getContinueState([evidence("d-1")], tikanik);
    expect(state?.recommendation.href).toBe("/ders/d-2");
  });

  it("müfredatın BAŞINDAKİ ziyaret edilmemiş bir hattı önermez — son yerden SONRAKİ ilk adayı önerir", () => {
    // Kullanıcı hiç dokunmadığı hatIndex 0'ı değil, az önce okuduğu
    // hatIndex 1'deki dersten SONRAKİ adımı görmeli. Eski (hatalı) sürüm
    // her seferinde seviyenin en baştaki ziyaret edilmemiş dersine dönüyordu.
    const cokHattli: ContinueLesson[] = [
      lesson({ slug: "hic-dokunulmamis", hatIndex: 0, sira: 1 }),
      lesson({ slug: "okunan", hatIndex: 1, sira: 1 }),
      lesson({ slug: "sonraki-durak", hatIndex: 1, sira: 2 }),
    ];
    const state = getContinueState([evidence("okunan")], cokHattli);
    expect(state?.recommendation.href).toBe("/ders/sonraki-durak");
  });

  it("son yerden sonrası tükendiyse (ileri atlanmış bir öğrenci) daha önceki ziyaret edilmemiş bir derse düşer", () => {
    const geriDonus: ContinueLesson[] = [
      lesson({ slug: "atlanan", hatIndex: 0, sira: 1 }),
      lesson({ slug: "ileri-baslanan", hatIndex: 2, sira: 1 }),
    ];
    const state = getContinueState([evidence("ileri-baslanan")], geriDonus);
    expect(state?.recommendation.href).toBe("/ders/atlanan");
  });

  it("listede olmayan (henüz indirilmemiş) bir önkoşul kaydı, hazır olma kontrolünü engellemez", () => {
    const kucukEvren: ContinueLesson[] = [
      lesson({ slug: "k-1", hatIndex: 0, sira: 1 }),
      lesson({ slug: "k-2", hatIndex: 0, sira: 2, onkosul: ["baska-yerde-tanimli-ders"] }),
    ];
    const state = getContinueState([evidence("k-1")], kucukEvren);
    expect(state?.recommendation.href).toBe("/ders/k-2");
  });
});
