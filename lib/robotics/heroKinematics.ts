export type VerticalMovement = "up" | "down" | "steady";

export const HERO_ARM = {
  shoulder: { x: 104, y: 116 },
  link1: 62,
  link2: 54,
} as const;

const DEG = Math.PI / 180;

export function heroArmPoints(q1Degrees: number, q2Degrees: number) {
  const a1 = -q1Degrees * DEG;
  const a2 = -(q1Degrees + q2Degrees) * DEG;
  const elbow = {
    x: HERO_ARM.shoulder.x + HERO_ARM.link1 * Math.cos(a1),
    y: HERO_ARM.shoulder.y + HERO_ARM.link1 * Math.sin(a1),
  };
  const end = {
    x: elbow.x + HERO_ARM.link2 * Math.cos(a2),
    y: elbow.y + HERO_ARM.link2 * Math.sin(a2),
  };
  return { elbow, end };
}

/** SVG'de y aşağı doğru büyür; bu yüzden negatif fark ekranda yukarı harekettir. */
export function classifyVerticalMovement(beforeY: number, afterY: number, epsilon = 0.25): VerticalMovement {
  const delta = afterY - beforeY;
  if (Math.abs(delta) <= epsilon) return "steady";
  return delta < 0 ? "up" : "down";
}
