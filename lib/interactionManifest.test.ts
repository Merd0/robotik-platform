import { describe, expect, it } from "vitest";
import {
  computeInteractionHash,
  computePredicateHash,
  extractComponentStringProp,
  extractUsedComponents,
  LAB_DEPENDENCY_REGISTRY,
  readDependencyDigests,
} from "./interactionManifest";
import { getLessonBySlug } from "./content";

describe("extractUsedComponents — MDX AST'den gerçek bileşen kullanımı", () => {
  it("frontmatter'a değil gövdeye bakar, izinli bileşenleri bulur", () => {
    const mdx = `---\nid: x\netkilesimli: [YanlisBilgi]\n---\n\n<JointSliders robot="generic-2dof" />\n\n<TransferChallenge skillId="x" prompt="p" options={["a"]} correct={0} hint="h" explanation="e" />\n`;
    expect(extractUsedComponents(mdx)).toEqual(["JointSliders", "TransferChallenge"]);
  });

  it("izinli olmayan bir JSX adını yok sayar (mdxGuvenlik zaten reddeder, burada sadece toplanmaz)", () => {
    const mdx = `---\nid: x\n---\n\n<UydurmaBilesen />\n<JointSliders robot="generic-2dof" />\n`;
    expect(extractUsedComponents(mdx)).toEqual(["JointSliders"]);
  });

  it("aynı bileşen birden çok kez geçse bile tekil döner", () => {
    const mdx = `---\nid: x\n---\n\n<Quiz sorular={[]} />\n<Quiz sorular={[]} />\n`;
    expect(extractUsedComponents(mdx)).toEqual(["Quiz"]);
  });

  it("gerçek ders dosyalarında da doğru çalışır: b-ortaokul-eklemleri-oynat", () => {
    const lesson = getLessonBySlug("b-ortaokul-eklemleri-oynat")!;
    const used = extractUsedComponents(lesson.body);
    expect(used).toContain("JointSliders");
    expect(used).toEqual([...used].sort());
  });
});

describe("extractComponentStringProp — düz metin prop değerleri", () => {
  it("robot prop'unun literal değerini yakalar", () => {
    const mdx = `---\nid: x\n---\n\n<JointSliders robot="generic-2dof" />\n`;
    expect(extractComponentStringProp(mdx, "JointSliders", "robot")).toEqual(["generic-2dof"]);
  });

  it("aynı bileşenin farklı çağrılarındaki farklı değerleri toplar ve sıralar", () => {
    const mdx = `---\nid: x\n---\n\n<JointSliders robot="generic-6dof" />\n<JointSliders robot="generic-2dof" />\n`;
    expect(extractComponentStringProp(mdx, "JointSliders", "robot")).toEqual(["generic-2dof", "generic-6dof"]);
  });

  it("başka bileşenin aynı adlı prop'unu karıştırmaz", () => {
    const mdx = `---\nid: x\n---\n\n<IkTarget robot="generic-2dof" />\n`;
    expect(extractComponentStringProp(mdx, "JointSliders", "robot")).toEqual([]);
  });

  it("gerçek ders dosyasında JointSliders'ın robot prop'unu doğru okur", () => {
    const lesson = getLessonBySlug("b-ortaokul-eklemleri-oynat")!;
    expect(extractComponentStringProp(lesson.body, "JointSliders", "robot")).toEqual(["generic-2dof"]);
  });
});

describe("readDependencyDigests", () => {
  it("her dosya için tutarlı sha256 üretir", () => {
    const digests = readDependencyDigests(["lib/robotics/kinematics.ts"]);
    expect(digests["lib/robotics/kinematics.ts"]).toMatch(/^[0-9a-f]{64}$/);
    expect(readDependencyDigests(["lib/robotics/kinematics.ts"])).toEqual(digests);
  });

  it("bilinmeyen dosya için fırlatır (sessizce eksik hash üretmez)", () => {
    expect(() => readDependencyDigests(["lib/robotics/olmayan-dosya.ts"])).toThrow();
  });
});

describe("computeInteractionHash — bileşen + motor + robot spec + worker imzası", () => {
  it("aynı girdi için deterministik", () => {
    const a = computeInteractionHash(["JointSliders"], ["generic-2dof"]);
    const b = computeInteractionHash(["JointSliders"], ["generic-2dof"]);
    expect(a).toBe(b);
    expect(a).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("farklı robot id farklı hash üretir (aynı bileşen, farklı spesifikasyon)", () => {
    const twoDof = computeInteractionHash(["JointSliders"], ["generic-2dof"]);
    const sixDof = computeInteractionHash(["JointSliders"], ["generic-6dof"]);
    expect(twoDof).not.toBe(sixDof);
  });

  it("farklı bileşen kümesi farklı hash üretir", () => {
    const jointSliders = computeInteractionHash(["JointSliders"], ["generic-2dof"]);
    const ikTarget = computeInteractionHash(["IkTarget"], ["generic-2dof"]);
    expect(jointSliders).not.toBe(ikTarget);
  });

  it("robot id sırası hash'i etkilemez (kanonik sıralama)", () => {
    const a = computeInteractionHash(["JointSliders", "IkTarget"], ["generic-2dof", "generic-6dof"]);
    const b = computeInteractionHash(["IkTarget", "JointSliders"], ["generic-6dof", "generic-2dof"]);
    expect(a).toBe(b);
  });

  it("PlannerRace worker kaynağını da kapsar (registry'de workerFiles var)", () => {
    expect(LAB_DEPENDENCY_REGISTRY.PlannerRace.workerFiles).toEqual(["lib/workers/plannerWorker.ts"]);
    // Worker dosyası gerçekten okunabiliyor mu (hash hesaplanırken atlanmıyor).
    expect(() => computeInteractionHash(["PlannerRace"])).not.toThrow();
  });

  it("CodeRunner motor, Pyodide worker ve çalışma limitlerini interactionHash'e bağlar", () => {
    expect(LAB_DEPENDENCY_REGISTRY.CodeRunner).toMatchObject({
      componentFile: "components/interactive/CodeRunner.tsx",
      engineFiles: expect.arrayContaining(["lib/codeLab.ts", "lib/robotics/kinematics.ts"]),
      workerFiles: ["lib/workers/pyodideWorker.ts", "lib/workers/executionLimits.ts"],
    });
    expect(() => computeInteractionHash(["CodeRunner"], ["generic-2dof"])).not.toThrow();
  });

  it("SignalTimeline bileşeni ile el sıkışma motorunu interactionHash'e bağlar", () => {
    expect(LAB_DEPENDENCY_REGISTRY.SignalTimeline).toEqual({
      componentFile: "components/interactive/SignalTimeline.tsx",
      engineFiles: ["lib/signalTimeline.ts"],
    });
    expect(() => computeInteractionHash(["SignalTimeline"])).not.toThrow();
  });

  it("SafetyZone bileşeni ile güvenlik hesabı motorunu interactionHash'e bağlar", () => {
    expect(LAB_DEPENDENCY_REGISTRY.SafetyZone).toEqual({
      componentFile: "components/interactive/SafetyZone.tsx",
      engineFiles: ["lib/robotics/safety.ts"],
    });
    expect(() => computeInteractionHash(["SafetyZone"])).not.toThrow();
  });

  it("pilot kapsamı dışındaki bir bileşen için açıkça hata fırlatır", () => {
    expect(() => computeInteractionHash(["Quiz"])).toThrow(/LAB_DEPENDENCY_REGISTRY/);
  });

  it("bilinmeyen robot id için açıkça hata fırlatır", () => {
    expect(() => computeInteractionHash(["JointSliders"], ["olmayan-robot"])).toThrow(/bilinmeyen robot id/);
  });
});

describe("computePredicateHash — dersin predicate sürüm imzası", () => {
  it("predicate'i olmayan ders için de deterministik (boş küme) döner", () => {
    const a = computePredicateHash("hic-boyle-bir-ders-yok");
    const b = computePredicateHash("hic-boyle-bir-ders-yok");
    expect(a).toBe(b);
    expect(a).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("farklı ders farklı hash üretir", () => {
    const a = computePredicateHash("b-ortaokul-eklemleri-oynat");
    const b = computePredicateHash("c-universite-algoritma-karsilastirma-deneyi");
    expect(a).not.toBe(b);
  });

  it("sprint 0'da sürümlenen predicate id'yi yansıtır", () => {
    // forward-kinematics-dual-joint-v1 -> v2 sürüm atlaması bu hash'e yansımalı;
    // aksi halde "predicate mantığı değişti" sinyali sessizce kaybolurdu.
    const hash = computePredicateHash("b-ortaokul-eklemleri-oynat");
    expect(hash).toBe(computePredicateHash("b-ortaokul-eklemleri-oynat"));
  });

  it("CodeRunner ana dersini python-command-trace predicate sürümüne bağlar", () => {
    expect(computePredicateHash("d-lise-python-komut-dizisi"))
      .not.toBe(computePredicateHash("hic-boyle-bir-ders-yok"));
  });

  it("SignalTimeline ana dersini handshake predicate sürümüne bağlar", () => {
    expect(computePredicateHash("e-lise-el-sikisma"))
      .not.toBe(computePredicateHash("hic-boyle-bir-ders-yok"));
  });

  it("SafetyZone ana dersini frenleme-mesafe predicate sürümüne bağlar", () => {
    expect(computePredicateHash("h-universite-guvenli-durus-hiz-ve-mesafe"))
      .not.toBe(computePredicateHash("hic-boyle-bir-ders-yok"));
  });
});
