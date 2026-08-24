import { describe, expect, it } from "vitest";
import {
  deriveRobotState,
  ROBOT_STATE_LABEL,
  ROBOT_STATE_TONE,
  type RobotState,
} from "./robotState";

describe("deriveRobotState", () => {
  it("hiçbir sinyal yokken idle döner", () => {
    expect(deriveRobotState({})).toBe("idle");
  });

  it("busy true ve phase verilmezse moving döner (varsayılan aşama)", () => {
    expect(deriveRobotState({ busy: true })).toBe("moving");
  });

  it("busy true ve phase planning ise planning döner", () => {
    expect(deriveRobotState({ busy: true, phase: "planning" })).toBe("planning");
  });

  it("busy true ve phase moving ise moving döner", () => {
    expect(deriveRobotState({ busy: true, phase: "moving" })).toBe("moving");
  });

  it("completed true ve başka sinyal yoksa completed döner", () => {
    expect(deriveRobotState({ completed: true })).toBe("completed");
  });

  it("paused true ise paused döner", () => {
    expect(deriveRobotState({ paused: true })).toBe("paused");
  });

  it("error true ise error döner", () => {
    expect(deriveRobotState({ error: true })).toBe("error");
  });

  it("collision true ise collision döner", () => {
    expect(deriveRobotState({ collision: true })).toBe("collision");
  });

  it("unreachable true ise unreachable döner", () => {
    expect(deriveRobotState({ unreachable: true })).toBe("unreachable");
  });

  // Öncelik sırası: collision > unreachable > error > paused > busy > completed > idle.
  it("collision, diğer TÜM sinyaller true olsa bile önceliklidir", () => {
    expect(
      deriveRobotState({
        collision: true,
        unreachable: true,
        error: true,
        paused: true,
        busy: true,
        completed: true,
      }),
    ).toBe("collision");
  });

  it("unreachable, error/paused/busy/completed true olsa bile error'dan önceliklidir", () => {
    expect(
      deriveRobotState({
        unreachable: true,
        error: true,
        paused: true,
        busy: true,
        completed: true,
      }),
    ).toBe("unreachable");
  });

  it("error, paused/busy/completed true olsa bile önceliklidir (ör. meşgulken worker çöktü)", () => {
    expect(deriveRobotState({ error: true, paused: true, busy: true, completed: true })).toBe(
      "error",
    );
  });

  it("paused, busy/completed true olsa bile önceliklidir", () => {
    expect(deriveRobotState({ paused: true, busy: true, completed: true })).toBe("paused");
  });

  it("busy, completed true olsa bile önceliklidir (ör. yeniden çalıştırma sırasında eski tamamlanma bayrağı kalmış)", () => {
    expect(deriveRobotState({ busy: true, completed: true })).toBe("moving");
  });

  // Negatif: yanlışlıkla "her zaman busy" veya "her zaman completed" gibi
  // aşırı-izin verici bir varsayılana düşmediğini doğrula.
  it("busy false ve completed false ise, diğer her şey false olsa bile idle döner (moving/completed'a sessizce düşmez)", () => {
    expect(
      deriveRobotState({ busy: false, completed: false, paused: false, error: false }),
    ).toBe("idle");
  });

  it("ROBOT_STATE_LABEL 8 durumun tamamı için ayrı, boş olmayan bir Türkçe etiket taşır", () => {
    const states: RobotState[] = [
      "idle",
      "planning",
      "moving",
      "paused",
      "completed",
      "error",
      "collision",
      "unreachable",
    ];
    const labels = states.map((state) => ROBOT_STATE_LABEL[state]);
    expect(labels.every((label) => typeof label === "string" && label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(states.length);
  });

  it("ROBOT_STATE_TONE güvenlik-kritik durumları (collision, error) danger tonuna eşler", () => {
    expect(ROBOT_STATE_TONE.collision).toBe("danger");
    expect(ROBOT_STATE_TONE.error).toBe("danger");
    expect(ROBOT_STATE_TONE.unreachable).toBe("warning");
    expect(ROBOT_STATE_TONE.completed).toBe("success");
  });
});
