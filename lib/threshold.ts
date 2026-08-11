export const THRESHOLD_COLUMNS = 12;
export const THRESHOLD_ROWS = 8;
const CENTER_COL = 6;
const CENTER_ROW = 4;
const OBJECT_RADIUS = 2.4;

export type ThresholdRegime = "too-low" | "separating" | "too-high" | "mixed";

export function isObjectCell(col: number, row: number): boolean {
  return Math.hypot(col - CENTER_COL, row - CENTER_ROW) < OBJECT_RADIUS;
}

/** Deterministik parlaklık: yüksek parlaklıklı nesne + düşük parlaklıklı gürültülü arka plan. */
export function thresholdBrightness(col: number, row: number): number {
  const base = isObjectCell(col, row) ? 200 : 70;
  const pseudoNoise = ((col * 31 + row * 17) % 23) - 11;
  return Math.min(255, Math.max(0, base + pseudoNoise));
}

export function buildThresholdGrid(): number[][] {
  return Array.from({ length: THRESHOLD_ROWS }, (_, row) =>
    Array.from({ length: THRESHOLD_COLUMNS }, (_, col) => thresholdBrightness(col, row)),
  );
}

export function analyzeThreshold(threshold: number) {
  const grid = buildThresholdGrid();
  let detectedCount = 0;
  let objectCellCount = 0;
  let falsePositiveCount = 0;
  let falseNegativeCount = 0;

  grid.forEach((rowValues, row) => rowValues.forEach((brightness, col) => {
    const object = isObjectCell(col, row);
    const detected = brightness >= threshold;
    if (object) objectCellCount += 1;
    if (detected) detectedCount += 1;
    if (detected && !object) falsePositiveCount += 1;
    if (!detected && object) falseNegativeCount += 1;
  }));

  const regime: ThresholdRegime = falsePositiveCount > 0 && falseNegativeCount > 0
    ? "mixed"
    : falsePositiveCount > 0
      ? "too-low"
      : falseNegativeCount > 0
        ? "too-high"
        : "separating";

  return { threshold, detectedCount, objectCellCount, falsePositiveCount, falseNegativeCount, regime };
}
