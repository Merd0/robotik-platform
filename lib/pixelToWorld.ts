export const PIXEL_GRID_SIZE = 8;
export const PIXELS_PER_GRID_CELL = 10;

export interface PixelWorldResult {
  pixelX: number;
  pixelY: number;
  worldX: number;
  worldY: number;
  effectiveCalibration: number;
  distanceFromCenter: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

/** Sabit ölçekli öğretici piksel→mm motoru; isteğe bağlı merkez-uzaklığı sapması ekler. */
export function pixelToWorld(
  col: number,
  row: number,
  calibration: number,
  distortion: boolean,
): PixelWorldResult {
  const pixelX = col * PIXELS_PER_GRID_CELL;
  const pixelY = row * PIXELS_PER_GRID_CELL;
  const center = (PIXEL_GRID_SIZE - 1) / 2;
  const distanceFromCenter = Math.hypot(col - center, row - center);
  const effectiveCalibration = distortion
    ? calibration * (1 + distanceFromCenter * 0.06)
    : calibration;

  return {
    pixelX,
    pixelY,
    worldX: round(pixelX * effectiveCalibration),
    worldY: round(pixelY * effectiveCalibration),
    effectiveCalibration,
    distanceFromCenter,
  };
}
