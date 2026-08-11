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

describe("encodeLabState / decodeLabState — round-trip", () => {
  it.each([
    ["joint-sliders", jointSliders],
    ["planner-race", plannerRace],
    ["ik-target", ikTarget],
    ["code-runner", codeRunner],
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

  it("decodeLabState fiziksel olarak geçersiz ama biçimsel olarak doğru bir state'i de reddeder", () => {
    const encoded = encodeLabState({ ...jointSliders, jointAngles: [10, 0] });
    const result = decodeLabState(encoded);
    expect(result.ok).toBe(false);
  });
});
