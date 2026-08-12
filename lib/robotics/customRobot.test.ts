import { describe, expect, it } from "vitest";
import { forwardKinematics } from "./kinematics";
import {
  createCustomRobotSpec,
  createDefaultCustomRobotDefinition,
  customRobotSpecToDefinition,
  type CustomRobotDefinition,
} from "./customRobot";

const goldenDefinition: CustomRobotDefinition = {
  name: "Ders kolu",
  joints: [
    { type: "revolute", linkLength: 1, minDegrees: -120, maxDegrees: 120 },
    { type: "revolute", linkLength: 0.5, minDegrees: -90, maxDegrees: 135 },
  ],
};

describe("kullanıcı tanımlı RobotSpec", () => {
  it("geçerli tanımı kanonik, düzlemsel RobotSpec'e dönüştürür", () => {
    const result = createCustomRobotSpec(goldenDefinition);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.robot).toEqual({
      id: "custom-robot-v1",
      displayName: "Ders kolu",
      joints: [
        {
          type: "revolute",
          dhParams: { a: 1, alpha: 0, d: 0, theta: 0 },
          limits: { min: (-120 * Math.PI) / 180, max: (120 * Math.PI) / 180 },
          maxVelocity: Math.PI,
        },
        {
          type: "revolute",
          dhParams: { a: 0.5, alpha: 0, d: 0, theta: 0 },
          limits: { min: -Math.PI / 2, max: (135 * Math.PI) / 180 },
          maxVelocity: Math.PI,
        },
      ],
    });
  });

  it("üretilen RobotSpec mevcut FK çekirdeğinde doğru sonucu verir", () => {
    const result = createCustomRobotSpec(goldenDefinition);
    if (!result.ok) throw new Error("golden robot üretilemedi");

    const { endEffector } = forwardKinematics(result.robot, [Math.PI / 2, 0]);
    expect(endEffector.x).toBeCloseTo(0, 8);
    expect(endEffector.y).toBeCloseTo(1.5, 8);
    expect(endEffector.z).toBeCloseTo(0, 8);
  });

  it("RobotSpec ↔ düzenleme tanımı dönüşümünü kayıpsız yapar", () => {
    const result = createCustomRobotSpec(goldenDefinition);
    if (!result.ok) throw new Error("golden robot üretilemedi");

    expect(customRobotSpecToDefinition(result.robot)).toEqual(goldenDefinition);
  });

  it.each([
    ["sıfır DOF", { ...goldenDefinition, joints: [] }, "1 ile 6"],
    ["yedi DOF", { ...goldenDefinition, joints: Array.from({ length: 7 }, () => goldenDefinition.joints[0]) }, "1 ile 6"],
    ["sıfır uzunluk", { ...goldenDefinition, joints: [{ ...goldenDefinition.joints[0], linkLength: 0 }] }, "0,05"],
    ["negatif uzunluk", { ...goldenDefinition, joints: [{ ...goldenDefinition.joints[0], linkLength: -1 }] }, "0,05"],
    ["aşırı uzunluk", { ...goldenDefinition, joints: [{ ...goldenDefinition.joints[0], linkLength: 2.01 }] }, "2"],
    ["eşit limit", { ...goldenDefinition, joints: [{ ...goldenDefinition.joints[0], minDegrees: 30, maxDegrees: 30 }] }, "küçük"],
    ["ters limit", { ...goldenDefinition, joints: [{ ...goldenDefinition.joints[0], minDegrees: 60, maxDegrees: -20 }] }, "küçük"],
    ["limit aralık dışında", { ...goldenDefinition, joints: [{ ...goldenDefinition.joints[0], minDegrees: -181 }] }, "−180°"],
  ] as const)("%s robot tanımını reddeder", (_label, definition, message) => {
    const result = createCustomRobotSpec(definition as CustomRobotDefinition);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message).join(" ")).toContain(message);
  });

  it("v1'de doğrusal eklemi açıkça reddeder", () => {
    const definition = {
      ...goldenDefinition,
      joints: [{ ...goldenDefinition.joints[0], type: "prismatic" }],
    } as unknown as CustomRobotDefinition;
    const result = createCustomRobotSpec(definition);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0].message).toContain("yalnız dönel");
  });

  it("DOF değiştiğinde güvenli varsayılan eklem satırları üretir", () => {
    const definition = createDefaultCustomRobotDefinition(6);
    expect(definition.joints).toHaveLength(6);
    expect(createCustomRobotSpec(definition).ok).toBe(true);
  });
});
