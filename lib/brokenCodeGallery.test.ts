import { describe, expect, it } from "vitest";
import { BROKEN_CODE_CARDS } from "./brokenCodeGallery";
import { getRobotById } from "./robotics/robots";

describe("BROKEN_CODE_CARDS", () => {
  it("her kartın id'si tekildir", () => {
    const ids = BROKEN_CODE_CARDS.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("her kartın skillId'si de tekildir (Evidence karışmasın)", () => {
    const skillIds = BROKEN_CODE_CARDS.map((card) => card.skillId);
    expect(new Set(skillIds).size).toBe(skillIds.length);
  });

  it("her kart, kullandığı robotun gerçek eklem sayısı kadar açı bekler", () => {
    for (const card of BROKEN_CODE_CARDS) {
      const robot = getRobotById(card.robot);
      expect(card.expectedFinalDegrees).toHaveLength(robot.joints.length);
    }
  });

  it("her kartın senaryo metni, başlangıç kodu ve contentVersion'ı boş değildir", () => {
    for (const card of BROKEN_CODE_CARDS) {
      expect(card.scenario.length).toBeGreaterThan(0);
      expect(card.initialCode.length).toBeGreaterThan(0);
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.contentVersion.length).toBeGreaterThan(0);
    }
  });

  it("en az 4 farklı arıza türü içerir", () => {
    expect(BROKEN_CODE_CARDS.length).toBeGreaterThanOrEqual(4);
  });
});
