import { describe, expect, it } from "vitest";
import { pixelToWorld } from "./pixelToWorld";

describe("pixelToWorld", () => {
  it("golden: piksel koordinatını sabit kalibrasyonla milimetreye çevirir", () => {
    expect(pixelToWorld(5, 2, 5, false)).toMatchObject({
      pixelX: 50,
      pixelY: 20,
      worldX: 250,
      worldY: 100,
      effectiveCalibration: 5,
    });
  });

  it("bozulma açıkken çevresel hücrenin ölçümünü büyütür", () => {
    const plain = pixelToWorld(7, 7, 5, false);
    const distorted = pixelToWorld(7, 7, 5, true);
    expect(distorted.worldX).toBeGreaterThan(plain.worldX);
    expect(distorted.worldY).toBeGreaterThan(plain.worldY);
  });

  it("merkeze yakın hücredeki sapma köşedekinden küçüktür", () => {
    const near = pixelToWorld(4, 4, 5, true).effectiveCalibration - 5;
    const corner = pixelToWorld(7, 7, 5, true).effectiveCalibration - 5;
    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(corner);
  });
});
