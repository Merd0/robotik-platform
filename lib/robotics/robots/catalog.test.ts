import { describe, expect, it } from "vitest";
import { forwardKinematics } from "../kinematics";
import { genericSixDofRobot, genericTwoDofRobot, getRobotById, meca500R4Robot } from ".";

const deg = (value: number) => value * Math.PI / 180;

/**
 * Beklenen bütün sayılar üreticinin kamuya açık MC-UM-MECA500 2026.B
 * dokümanındaki Tablo 7 (limit/hız/erişim) ve Şekil 18'den (DH geometrisi)
 * gelir:
 * https://resources.mecademic.com/en/doc/MC-UM-MECA500/2026.B/manual/technical-specifications.html
 */
describe("robot kataloğu", () => {
  it("jenerik presetleri gerçek bir üretici modeli olarak etiketlemez", () => {
    expect(genericTwoDofRobot.metadata).toBeUndefined();
    expect(genericSixDofRobot.metadata).toBeUndefined();
  });

  it("Meca500 R4 presetini resmî kaynak metadata'sıyla kaydeder", () => {
    expect(getRobotById("meca500-r4")).toBe(meca500R4Robot);
    expect(meca500R4Robot.metadata).toEqual({
      manufacturer: "Mecademic",
      model: "Meca500 R4",
      maxReachMm: 330,
      payloadKg: 0.5,
      source: {
        kind: "official-doc",
        title: "MC-UM-MECA500 — Technical specifications, Table 7 and Figure 18",
        publisher: "Mecademic",
        url: "https://resources.mecademic.com/en/doc/MC-UM-MECA500/2026.B/manual/technical-specifications.html",
        version: "2026.B.277",
        accessedAt: "2026-08-23",
      },
    });
  });

  it("Meca500 R4 standart DH geometrisini metre ve radyanla saklar", () => {
    expect(meca500R4Robot.joints.map((joint) => joint.dhParams)).toEqual([
      { a: 0, alpha: Math.PI / 2, d: 0.135, theta: 0 },
      { a: 0.135, alpha: 0, d: 0, theta: Math.PI / 2 },
      { a: 0.038, alpha: Math.PI / 2, d: 0, theta: 0 },
      { a: 0, alpha: -Math.PI / 2, d: 0.12, theta: 0 },
      { a: 0, alpha: Math.PI / 2, d: 0, theta: 0 },
      { a: 0, alpha: 0, d: 0.07, theta: 0 },
    ]);

    const zeroPose = forwardKinematics(meca500R4Robot, [0, 0, 0, 0, 0, 0]).endEffector;
    expect(zeroPose.x).toBeCloseTo(0.19, 9);
    expect(zeroPose.y).toBeCloseTo(0, 9);
    expect(zeroPose.z).toBeCloseTo(0.308, 9);
  });

  it("Meca500 R4 eklem limitlerini ve R4 azami hızlarını korur", () => {
    expect(meca500R4Robot.joints.map((joint) => joint.limits)).toEqual([
      { min: deg(-175), max: deg(175) },
      { min: deg(-70), max: deg(90) },
      { min: deg(-135), max: deg(70) },
      { min: deg(-170), max: deg(170) },
      { min: deg(-115), max: deg(115) },
      { min: deg(-36_000), max: deg(36_000) },
    ]);
    expect(meca500R4Robot.joints.map((joint) => joint.maxVelocity)).toEqual([
      deg(225),
      deg(225),
      deg(225),
      deg(350),
      deg(350),
      deg(500),
    ]);
  });
});
