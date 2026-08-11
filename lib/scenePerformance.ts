export interface SceneDprInput {
  viewportWidth: number;
  devicePixelRatio: number;
  hardwareConcurrency?: number;
  deviceMemoryGb?: number;
}

/**
 * Okunabilirliği korurken mobil/düşük kapasiteli cihazlarda piksel maliyetini
 * sınırlar. R3F sayısal DPR değerini doğrudan canvas çözünürlüğüne uygular.
 */
export function selectSceneDpr({
  viewportWidth,
  devicePixelRatio,
  hardwareConcurrency,
  deviceMemoryGb,
}: SceneDprInput): number {
  const constrained =
    viewportWidth <= 768 ||
    (hardwareConcurrency !== undefined && hardwareConcurrency <= 4) ||
    (deviceMemoryGb !== undefined && deviceMemoryGb <= 4);
  const ceiling = constrained ? 1.25 : 1.75;
  const ratio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.max(1, Math.min(ratio, ceiling));
}
