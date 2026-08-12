import { describe, expect, it } from "vitest";
import {
  decodeLabState,
  encodeLabState,
  MAX_SHAREABLE_CODE_LENGTH,
  validateLabState,
  type LabState,
} from "./labState";

const jointSliders: LabState = { kind: "joint-sliders", version: 1, robotId: "generic-2dof", jointAngles: [0.3, -0.5] };

const plannerRace: LabState = {
  kind: "planner-race",
  version: 1,
  extent: 3,
  seed: 240807,
  algorithms: ["astar", "rrt", "rrt_star"],
  obstacles: [{ kind: "sphere", center: { x: 0, y: 0, z: 0 }, size: [0.18] }],
};

const ikTarget: LabState = { kind: "ik-target", version: 1, robotId: "generic-2dof", target: { x: 0.9, y: 0.3 }, elbow: "up", solver: "auto" };

const codeRunner: LabState = {
  kind: "code-runner",
  version: 1,
  robotId: "generic-2dof",
  code: 'robot.eklem_ac(0, 60)\nprint("hazır")',
};

const signalTimeline: LabState = {
  kind: "signal-timeline",
  version: 1,
  signals: ["Robot: Hazır", "PLC: Aldım"],
  steps: 4,
  pattern: [
    [false, true, false, false],
    [false, false, false, true],
  ],
};

const safetyZone: LabState = {
  kind: "safety-zone",
  version: 1,
  mode: "hesap",
  distance: 1_150,
  robotSpeed: 1_000,
  brakingTime: 0.3,
};

const pixelToWorldState: LabState = {
  kind: "pixel-to-world",
  version: 1,
  adjustableCalibration: false,
  allowPerspectiveDistortion: true,
  calibration: 5,
  selected: { col: 7, row: 7 },
  showDistortion: true,
};

const jacobianViz: LabState = {
  kind: "jacobian-viz",
  version: 1,
  robotId: "generic-2dof",
  jointAngles: [Math.PI / 4, 0],
};

const scanPathState: LabState = {
  kind: "scan-path",
  version: 1,
  adjustableRows: true,
  rows: 2,
  visited: ["0-0", "1-0", "1-1", "0-1"],
};

const blockEditor: LabState = {
  kind: "block-editor",
  version: 1,
  robotId: "generic-2dof",
  allowedBlocks: ["move"],
  task: "sequence",
  blocks: [
    { id: "blok-1", type: "move", joint: 0, degrees: 45 },
    { id: "blok-2", type: "move", joint: 1, degrees: 60 },
  ],
  engelVar: false,
};

const thresholdViewer: LabState = {
  kind: "threshold-viewer",
  version: 1,
  theme: "lise",
  threshold: 128,
};

const transformOrder: LabState = {
  kind: "transform-order",
  version: 1,
  order: "rotation-then-translation",
  angleDegrees: 90,
  prediction: "x",
  revealed: true,
};

const dlsTrace: LabState = {
  kind: "dls-trace",
  version: 1,
  targetX: 1.15,
  targetY: 0.65,
  damping: 0.02,
  solved: true,
  step: 3,
};

const cspace: LabState = {
  kind: "cspace",
  version: 1,
  q1: 20,
  q2: 0,
  observed: { safe: true, collision: true },
};

const robotSelection: LabState = {
  kind: "robot-selection",
  version: 1,
  taskId: "intralogistics",
  layoutChangesOften: true,
  selectedId: "mir250",
  evidenceKeys: ["payload", "speed", "width", "positioning"],
  rationale: "Dört sayısal sınır karşılanıyor; saha trafiği ayrıca doğrulanmalı.",
  submitted: true,
  attempts: 1,
};

const fourLensTrace: LabState = {
  kind: "four-lens-trace",
  version: 1,
  activeLens: "code",
  prediction: "decrease",
  running: true,
  sampleIndex: 3,
  assessed: true,
};

const customRobot = {
  kind: "custom-robot",
  version: 1,
  definition: {
    name: "Öğretmen kolu",
    joints: [
      { type: "revolute", linkLength: 1, minDegrees: -120, maxDegrees: 120 },
      { type: "revolute", linkLength: 0.7, minDegrees: -90, maxDegrees: 135 },
    ],
  },
  jointAngles: [0.2, -0.3],
  target: { x: 0.8, y: 0.5 },
} as unknown as LabState;

describe("encodeLabState / decodeLabState — round-trip", () => {
  it.each([
    ["joint-sliders", jointSliders],
    ["planner-race", plannerRace],
    ["ik-target", ikTarget],
    ["code-runner", codeRunner],
    ["signal-timeline", signalTimeline],
    ["safety-zone", safetyZone],
    ["pixel-to-world", pixelToWorldState],
    ["jacobian-viz", jacobianViz],
    ["scan-path", scanPathState],
    ["block-editor", blockEditor],
    ["threshold-viewer", thresholdViewer],
    ["transform-order", transformOrder],
    ["dls-trace", dlsTrace],
    ["cspace", cspace],
    ["robot-selection", robotSelection],
    ["four-lens-trace", fourLensTrace],
    ["custom-robot", customRobot],
  ] as const)("%s: encode sonra decode aynı state'i verir", (_label, state) => {
    const encoded = encodeLabState(state);
    const result = decodeLabState(encoded);
    expect(result).toEqual({ ok: true, state });
  });

  it("URL fragment'ında güvenli karakter kümesi kullanır (yalnız A-Za-z0-9-_)", () => {
    const encoded = encodeLabState(plannerRace);
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("aynı state her zaman aynı kodu üretir (deterministik)", () => {
    expect(encodeLabState(jointSliders)).toBe(encodeLabState({ ...jointSliders }));
  });

  it("farklı state farklı kod üretir", () => {
    expect(encodeLabState(jointSliders)).not.toBe(encodeLabState({ ...jointSliders, jointAngles: [0, 0] }));
  });
});

describe("decodeLabState — biçim doğrulaması", () => {
  it("geçersiz base64url dizesini reddeder", () => {
    const result = decodeLabState("bu bir base64url degil!!");
    expect(result.ok).toBe(false);
  });

  it("base64url ama JSON olmayan içeriği reddeder", () => {
    const encoded = Buffer.from("bu json degil {{{", "utf8").toString("base64url");
    const result = decodeLabState(encoded);
    expect(result.ok).toBe(false);
  });

  it("bilinmeyen laboratuvar türünü reddeder", () => {
    const encoded = encodeLabState({ kind: "hayali-lab", version: 1 } as unknown as LabState);
    const result = decodeLabState(encoded);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("bilinmeyen laboratuvar türü") });
  });

  it("desteklenmeyen sürümü açıkça reddeder (sessizce yanlış yorumlamaz)", () => {
    const encoded = encodeLabState({ ...jointSliders, version: 2 } as unknown as LabState);
    const result = decodeLabState(encoded);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("desteklenmeyen sürüm") });
  });

  it("jointAngles'ın sayı dizisi olmasını zorunlu kılar", () => {
    const encoded = encodeLabState({ ...jointSliders, jointAngles: ["yanlis", 0.2] } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("sonsuz/NaN sayıları reddeder", () => {
    const encoded = encodeLabState({ ...jointSliders, jointAngles: [Number.NaN, 0.2] } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("planner-race: boş algoritma listesini reddeder", () => {
    const encoded = encodeLabState({ ...plannerRace, algorithms: [] } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("planner-race: güvensiz (ondalıklı/aşırı büyük) seed'i reddeder", () => {
    const encoded = encodeLabState({ ...plannerRace, seed: 1.5 } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("ik-target: geçersiz elbow değerini reddeder", () => {
    const encoded = encodeLabState({ ...ikTarget, elbow: "sola" } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("code-runner: robotId için yalnız null veya dolu string kabul eder", () => {
    const encoded = encodeLabState({ ...codeRunner, robotId: "" } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("code-runner: kod alanının string olmasını zorunlu kılar", () => {
    const encoded = encodeLabState({ ...codeRunner, code: ["print", "x"] } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("signal-timeline: yalnız boolean hücrelerden oluşan matrisi kabul eder", () => {
    const encoded = encodeLabState({
      ...signalTimeline,
      pattern: [[false, "açık"], [false, true]],
    } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("safety-zone: bilinmeyen modu ve sonlu olmayan sayıları reddeder", () => {
    expect(decodeLabState(encodeLabState({ ...safetyZone, mode: "hizli" } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...safetyZone, distance: Number.NaN } as unknown as LabState)).ok).toBe(false);
  });

  it("pixel-to-world: selected hücresinin sayısal col/row taşımasını zorunlu kılar", () => {
    const encoded = encodeLabState({ ...pixelToWorldState, selected: { col: "7", row: 7 } } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("jacobian-viz: jointAngles için yalnız sonlu sayı dizisi kabul eder", () => {
    const encoded = encodeLabState({ ...jacobianViz, jointAngles: [0, Number.NaN] } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });

  it("scan-path: rows tam sayı ve visited string dizisi olmalıdır", () => {
    expect(decodeLabState(encodeLabState({ ...scanPathState, rows: 2.5 } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...scanPathState, visited: [1, 2] } as unknown as LabState)).ok).toBe(false);
  });

  it("block-editor: bozuk veya aşırı derin blok ağacını reddeder", () => {
    expect(decodeLabState(encodeLabState({
      ...blockEditor,
      blocks: [{ id: "x", type: "bilinmeyen" }],
    } as unknown as LabState)).ok).toBe(false);
    let nested: unknown[] = [{ id: "leaf", type: "move", joint: 0, degrees: 10 }];
    for (let depth = 0; depth < 10; depth++) nested = [{ id: `r-${depth}`, type: "repeat", times: 2, body: nested }];
    expect(decodeLabState(encodeLabState({ ...blockEditor, blocks: nested } as unknown as LabState)).ok).toBe(false);
  });

  it("threshold-viewer: yalnız geçerli tema ve tam sayı eşik kabul eder", () => {
    expect(decodeLabState(encodeLabState({ ...thresholdViewer, theme: "ilkokul" } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...thresholdViewer, threshold: 127.5 } as unknown as LabState)).ok).toBe(false);
  });

  it("transform-order: yalnız geçerli sıra, tahmin ve tam sayı açı kabul eder", () => {
    expect(decodeLabState(encodeLabState({ ...transformOrder, order: "ters" } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...transformOrder, prediction: "z" } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...transformOrder, angleDegrees: 91.5 } as unknown as LabState)).ok).toBe(false);
  });

  it("dls-trace: hedef/damping sonlu sayı, step tam sayı ve solved boolean olmalıdır", () => {
    expect(decodeLabState(encodeLabState({ ...dlsTrace, damping: Number.NaN } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...dlsTrace, step: 1.5 } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...dlsTrace, solved: "evet" } as unknown as LabState)).ok).toBe(false);
  });

  it("cspace: q1/q2 tam sayı ve observed sınıfları boolean olmalıdır", () => {
    expect(decodeLabState(encodeLabState({ ...cspace, q1: 2.5 } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...cspace, observed: { safe: "evet", collision: true } } as unknown as LabState)).ok).toBe(false);
  });

  it("robot-selection: task, evidence dizisi ve attempts biçimini doğrular", () => {
    expect(decodeLabState(encodeLabState({ ...robotSelection, taskId: "hayali" } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...robotSelection, evidenceKeys: [1, 2] } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...robotSelection, attempts: 1.5 } as unknown as LabState)).ok).toBe(false);
  });

  it("four-lens-trace: lens, prediction ve örnek biçimini doğrular", () => {
    expect(decodeLabState(encodeLabState({ ...fourLensTrace, activeLens: "hayali" } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...fourLensTrace, prediction: "aynı" } as unknown as LabState)).ok).toBe(false);
    expect(decodeLabState(encodeLabState({ ...fourLensTrace, sampleIndex: 1.5 } as unknown as LabState)).ok).toBe(false);
  });

  it("custom-robot: bozuk eklem alanlarını URL'den kabul etmez", () => {
    const encoded = encodeLabState({
      ...(customRobot as object),
      definition: {
        name: "Bozuk kol",
        joints: [{ type: "revolute", linkLength: "uzun", minDegrees: -90, maxDegrees: 90 }],
      },
    } as unknown as LabState);
    expect(decodeLabState(encoded).ok).toBe(false);
  });
});

describe("validateLabState — fiziksel doğrulama (biçim doğru, değer sahada geçersiz)", () => {
  it("robotun eklem limitlerini aşan açıyı reddeder", () => {
    const errors = validateLabState({ ...jointSliders, jointAngles: [10, 0] });
    expect(errors.some((error) => error.includes("limit dışında"))).toBe(true);
  });

  it("bilinmeyen robot id'yi reddeder", () => {
    const errors = validateLabState({ ...jointSliders, robotId: "olmayan-robot" });
    expect(errors.some((error) => error.includes("bilinmeyen robot id"))).toBe(true);
  });

  it("robotun eklem sayısıyla uyuşmayan açı dizisini reddeder", () => {
    const errors = validateLabState({ ...jointSliders, jointAngles: [0, 0, 0] });
    expect(errors.some((error) => error.includes("eşleşmiyor"))).toBe(true);
  });

  it("geçerli eklem açılarında hata üretmez", () => {
    expect(validateLabState(jointSliders)).toEqual([]);
  });

  it("planner-race: sahne sınırları dışındaki engeli reddeder", () => {
    const errors = validateLabState({
      ...plannerRace,
      obstacles: [{ kind: "sphere", center: { x: 100, y: 0, z: 0 }, size: [0.1] }],
    });
    expect(errors.some((error) => error.includes("sınırlarının"))).toBe(true);
  });

  it("planner-race: geçerli engel düzeninde hata üretmez", () => {
    expect(validateLabState(plannerRace)).toEqual([]);
  });

  it("ik-target: robotun erişim yarıçapı dışındaki hedefi reddeder", () => {
    const errors = validateLabState({ ...ikTarget, target: { x: 999, y: 0 } });
    expect(errors.some((error) => error.includes("erişim yarıçapının"))).toBe(true);
  });

  it("ik-target: erişilebilir hedefte hata üretmez", () => {
    expect(validateLabState(ikTarget)).toEqual([]);
  });

  it("code-runner: bilinmeyen robotu ve paylaşım sınırını aşan kodu reddeder", () => {
    const errors = validateLabState({
      ...codeRunner,
      robotId: "olmayan-robot",
      code: "x".repeat(MAX_SHAREABLE_CODE_LENGTH + 1),
    });
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining("karakter sınırını"),
      expect.stringContaining("bilinmeyen robot id"),
    ]));
  });

  it("code-runner: robot kullanmayan, sınır içindeki kod state'i geçerlidir", () => {
    expect(validateLabState({ ...codeRunner, robotId: null })).toEqual([]);
  });

  it("signal-timeline: satır ve adım boyutları eşleşmeyen state'i reddeder", () => {
    const errors = validateLabState({ ...signalTimeline, pattern: [[false], [false, true]] });
    expect(errors).toContain("pattern satır uzunluğu steps ile eşleşmiyor");
  });

  it("signal-timeline: boş veya aşırı büyük zaman çizelgesini reddeder", () => {
    expect(validateLabState({ ...signalTimeline, signals: [], pattern: [] })).not.toEqual([]);
    expect(validateLabState({ ...signalTimeline, steps: 33, pattern: [new Array(33).fill(false), new Array(33).fill(false)] })).not.toEqual([]);
  });

  it("signal-timeline: boyutları eşleşen state geçerlidir", () => {
    expect(validateLabState(signalTimeline)).toEqual([]);
  });

  it("safety-zone: sahne, hız ve frenleme sınırları dışındaki değerleri reddeder", () => {
    expect(validateLabState({ ...safetyZone, distance: 4_001, robotSpeed: 2_001, brakingTime: 1.01 })).toHaveLength(3);
  });

  it("safety-zone: UI sınırlarındaki ölçüm state'i geçerlidir", () => {
    expect(validateLabState(safetyZone)).toEqual([]);
  });

  it("pixel-to-world: ızgara dışı hücreyi ve kapalı özellikte distortion'ı reddeder", () => {
    expect(validateLabState({ ...pixelToWorldState, selected: { col: 8, row: 7 } })).toContain("selected col/row 0-7 arasında olmalı");
    expect(validateLabState({ ...pixelToWorldState, allowPerspectiveDistortion: false })).toContain(
      "showDistortion yalnız perspektif özelliği açıkken true olabilir",
    );
  });

  it("pixel-to-world: doğrulanmış çevresel seçim state'i geçerlidir", () => {
    expect(validateLabState(pixelToWorldState)).toEqual([]);
  });

  it("jacobian-viz: bilinmeyen robotu ve eklem limiti dışındaki açıyı reddeder", () => {
    expect(validateLabState({ ...jacobianViz, robotId: "olmayan-robot" })).toContain("bilinmeyen robot id: olmayan-robot");
    expect(validateLabState({ ...jacobianViz, jointAngles: [10, 0] }).some((error) => error.includes("limit dışında"))).toBe(true);
  });

  it("jacobian-viz: robotla eşleşen açı state'i geçerlidir", () => {
    expect(validateLabState(jacobianViz)).toEqual([]);
  });

  it("scan-path: yinelenen, bozuk ve sınır dışı hücreleri reddeder", () => {
    const errors = validateLabState({ ...scanPathState, visited: ["0-0", "0-0", "12-0", "bozuk"] });
    expect(errors).toEqual(expect.arrayContaining([
      "visited yinelenen hücre içeremez",
      "visited hücresi sınır dışında: 12-0",
      "geçersiz visited hücresi: bozuk",
    ]));
  });

  it("scan-path: doğrulanmış kısmi tarama state'i geçerlidir", () => {
    expect(validateLabState(scanPathState)).toEqual([]);
  });

  it("block-editor: yinelenen id ve eklem limiti dışındaki açıyı reddeder", () => {
    const errors = validateLabState({
      ...blockEditor,
      blocks: [
        { id: "aynı", type: "move", joint: 0, degrees: 45 },
        { id: "aynı", type: "move", joint: 1, degrees: 999 },
      ],
    });
    expect(errors).toEqual(expect.arrayContaining([
      "yinelenen blok id: aynı",
      "blok aynı: açı eklem limiti dışında",
    ]));
  });

  it("block-editor: robot ve paletle eşleşen ağaç state'i geçerlidir", () => {
    expect(validateLabState(blockEditor)).toEqual([]);
  });

  it("threshold-viewer: 0-255 dışındaki eşikleri reddeder", () => {
    expect(validateLabState({ ...thresholdViewer, threshold: -1 })).toContain("threshold 0-255 arasında olmalı");
    expect(validateLabState({ ...thresholdViewer, threshold: 256 })).toContain("threshold 0-255 arasında olmalı");
  });

  it("threshold-viewer: ayıran eşik state'i geçerlidir", () => {
    expect(validateLabState(thresholdViewer)).toEqual([]);
  });

  it("transform-order: slider adımı dışındaki açıyı ve tahminsiz sonucu reddeder", () => {
    expect(validateLabState({ ...transformOrder, angleDegrees: 91 })).toContain("angleDegrees 0-180 arasında ve 15'in katı olmalı");
    expect(validateLabState({ ...transformOrder, prediction: null })).toContain("revealed state bir prediction gerektirir");
  });

  it("transform-order: doğrulanmış karşılaştırma görünümü geçerlidir", () => {
    expect(validateLabState(transformOrder)).toEqual([]);
  });

  it("dls-trace: slider sınırı/adımı dışını ve çalıştırılmamış izi reddeder", () => {
    expect(validateLabState({ ...dlsTrace, targetX: 1.17 })).toContain("targetX 0.2-1.7 arasında ve 0.05 adımında olmalı");
    expect(validateLabState({ ...dlsTrace, damping: 0.021 })).toContain("damping 0.005-0.2 arasında ve 0.005 adımında olmalı");
    expect(validateLabState({ ...dlsTrace, solved: false })).toContain("çalıştırılmamış state step 0 olmalı");
  });

  it("dls-trace: çözülmüş iz görünümü geçerlidir", () => {
    expect(validateLabState(dlsTrace)).toEqual([]);
  });

  it("cspace: slider sınırı ve 5 derece adımı dışını reddeder", () => {
    expect(validateLabState({ ...cspace, q1: 181 })).toContain("q1 -180 ile 180 arasında ve 5'in katı olmalı");
    expect(validateLabState({ ...cspace, q2: 7 })).toContain("q2 -180 ile 180 arasında ve 5'in katı olmalı");
  });

  it("cspace: iki sınıfı taşıyan geçerli görünüm state'i kabul edilir", () => {
    expect(validateLabState(cspace)).toEqual([]);
  });

  it("robot-selection: görev dışı aday, yinelenen/uygunsuz kriter ve aday yokken kararı reddeder", () => {
    expect(validateLabState({ ...robotSelection, selectedId: "epson-gx4-350" })).toContain("selectedId seçili görevde aday değil");
    expect(validateLabState({ ...robotSelection, evidenceKeys: ["payload", "payload"] })).toEqual(expect.arrayContaining([
      "evidenceKeys yinelenemez",
    ]));
    expect(validateLabState({ ...robotSelection, evidenceKeys: ["application"] })).toContain("uygun olmayan evidence key: application");
    expect(validateLabState({ ...robotSelection, selectedId: null })).toContain("aday seçilmeden kanıt/not/submit state'i taşınamaz");
  });

  it("robot-selection: görev motoruyla eşleşen karar state'i geçerlidir", () => {
    expect(validateLabState(robotSelection)).toEqual([]);
  });

  it("four-lens-trace: çalıştırma ve değerlendirme durumlarını tutarlı tutar", () => {
    expect(validateLabState({ ...fourLensTrace, running: false })).toEqual(expect.arrayContaining([
      "çalıştırılmamış state örnek 0'da ve değerlendirilmemiş olmalı",
    ]));
    expect(validateLabState({ ...fourLensTrace, prediction: null })).toContain("çalışan state bir prediction gerektirir");
    expect(validateLabState({ ...fourLensTrace, sampleIndex: 2 })).toContain("değerlendirilmiş state son örnekte olmalı");
  });

  it("four-lens-trace: son örnekteki değerlendirilmiş görünüm geçerlidir", () => {
    expect(validateLabState(fourLensTrace)).toEqual([]);
  });

  it("custom-robot: geçerli kullanıcı robotunu ve deney durumunu kabul eder", () => {
    expect(validateLabState(customRobot)).toEqual([]);
  });

  it("custom-robot: fiziksel olarak geçersiz uzunluk ve limit dışı açıyı reddeder", () => {
    const state = customRobot as unknown as {
      definition: { name: string; joints: Array<{ type: string; linkLength: number; minDegrees: number; maxDegrees: number }> };
      jointAngles: number[];
    };
    const invalidLength = {
      ...state,
      definition: { ...state.definition, joints: [{ ...state.definition.joints[0], linkLength: 0 }] },
      jointAngles: [0],
    } as unknown as LabState;
    const invalidAngle = { ...customRobot, jointAngles: [10, 0] } as unknown as LabState;

    expect(validateLabState(invalidLength).some((error) => error.includes("0,05"))).toBe(true);
    expect(validateLabState(invalidAngle).some((error) => error.includes("limit dışında"))).toBe(true);
    expect(decodeLabState(encodeLabState(invalidLength)).ok).toBe(false);
  });

  it("custom-robot: öğretilmiş yolu paylaşımda korur, bozuk programı reddeder", () => {
    const withProgram = {
      ...customRobot,
      program: {
        waypoints: [[0.2, -0.3], [0.35, -0.1]],
        speedScale: 0.5,
      },
    } as unknown as LabState;
    const decoded = decodeLabState(encodeLabState(withProgram));
    expect(decoded).toEqual({ ok: true, state: withProgram });

    const outsideLimits = {
      ...withProgram,
      program: { waypoints: [[0.2, -0.3], [10, 0]], speedScale: 0.5 },
    } as unknown as LabState;
    const tooManyWaypoints = {
      ...withProgram,
      program: { waypoints: Array.from({ length: 33 }, () => [0, 0]), speedScale: 0.5 },
    } as unknown as LabState;

    expect(decodeLabState(encodeLabState(outsideLimits)).ok).toBe(false);
    expect(decodeLabState(encodeLabState(tooManyWaypoints)).ok).toBe(false);
  });

  it("decodeLabState fiziksel olarak geçersiz ama biçimsel olarak doğru bir state'i de reddeder", () => {
    const encoded = encodeLabState({ ...jointSliders, jointAngles: [10, 0] });
    const result = decodeLabState(encoded);
    expect(result.ok).toBe(false);
  });
});
