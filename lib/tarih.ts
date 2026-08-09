/**
 * Proje saat dilimi.
 *
 * Denetim kayıtları (review makbuzu tarihi, doküman tarihleri) bakımcının
 * yaşadığı günü göstermeli. `toISOString().slice(0, 10)` UTC verir; Türkiye
 * UTC+3 olduğu için gece yarısı ile 03:00 arasında yapılan bir işlem bir gün
 * geriye yazılır. Bu, insan beyanı taşıyan bir kayıtta kabul edilemez.
 */
export const PROJE_SAAT_DILIMI = "Europe/Istanbul";

const ISO_GUN_BICIMI = new Intl.DateTimeFormat("en-CA", {
  timeZone: PROJE_SAAT_DILIMI,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Proje saat diliminde YYYY-MM-DD. */
export function bugunIstanbul(now: Date = new Date()): string {
  return ISO_GUN_BICIMI.format(now);
}
