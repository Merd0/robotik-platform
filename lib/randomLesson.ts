/**
 * "Rastgele ders" (FAZ 6 — kendi fikir) için saf seçim mantığı. Yeni bir
 * veri kaynağı YOK — `/arama-index.json`'daki (zaten var olan, arama için
 * üretilmiş) ders id listesinden seçer. `random` enjekte edilebilir (test
 * edilebilirlik için) — üretimde `Math.random`.
 */
export function pickRandomLessonId(
  ids: readonly string[],
  excludeId: string | undefined,
  random: () => number = Math.random,
): string | null {
  if (ids.length === 0) return null;
  const candidates = excludeId ? ids.filter((id) => id !== excludeId) : ids;
  const pool = candidates.length > 0 ? candidates : ids;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}
