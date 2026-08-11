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

  it("decodeLabState fiziksel olarak geçersiz ama biçimsel olarak doğru bir state'i de reddeder", () => {
    const encoded = encodeLabState({ ...jointSliders, jointAngles: [10, 0] });
    const result = decodeLabState(encoded);
    expect(result.ok).toBe(false);
  });
});
