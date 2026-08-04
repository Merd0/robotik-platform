/**
 * Güvenlik mesafesi hesapları — hız ve mesafe izleme (speed and separation
 * monitoring) sahnelerinin arkasındaki saf matematik.
 *
 * Buradaki model KASITLI OLARAK basitleştirilmiştir: bir insan ile bir robot
 * birbirine yaklaşırken, robotun durma kararını verip fiilen durmasına kadar
 * geçen sürede iki taraf da yol alır. Güvenli mesafe, bu iki yolun toplamına
 * bir belirsizlik payı eklenerek bulunur.
 *
 * ÖNEMLİ: bu, ISO 10218-2 / ISO/TS 15066'daki koruyucu ayrım mesafesi
 * (protective separation distance) formülünün TAM karşılığı DEĞİLDİR. Gerçek
 * formül, sensör belirsizliği ve robot konum belirsizliği gibi ek terimler
 * içerir ve standardın kendi metnine dayanır. Bu dosya, o formülün öğretici
 * bir yaklaşımıdır; ders metni bu ayrımı açıkça belirtir.
 *
 * Tüm mesafeler milimetre, tüm hızlar mm/s, tüm süreler saniyedir.
 */

export interface SeparationInput {
  /** Robotun uç noktasının insana doğru hız bileşeni (mm/s). */
  robotSpeed: number;
  /** İnsanın robota doğru varsayılan yaklaşma hızı (mm/s). */
  humanSpeed: number;
  /** Sistemin durma kararını vermesine kadar geçen süre (s) — algılama + işleme. */
  reactionTime: number;
  /** Durma kararı verildikten sonra robotun fiilen durmasına kadar geçen süre (s). */
  brakingTime: number;
  /** Ölçüm ve konum belirsizliği için sabit pay (mm). */
  uncertainty: number;
}

export interface SeparationResult {
  /** İnsanın toplam durma süresi boyunca aldığı yol (mm). */
  humanTravel: number;
  /** Robotun toplam durma süresi boyunca aldığı yol (mm). */
  robotTravel: number;
  /** Belirsizlik payı (mm). */
  uncertainty: number;
  /** Gerekli en küçük ayrım mesafesi (mm). */
  required: number;
}

export type ZoneState = "serbest" | "yavasla" | "dur";

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new Error(`${name} sonlu bir sayı olmalı`);
}

/**
 * Bir cismin sabit hızla, verilen süre boyunca aldığı yol.
 * Negatif hız veya süre anlamsızdır; sıfıra kırpılır.
 */
export function travelDistance(speed: number, seconds: number): number {
  assertFinite(speed, "speed");
  assertFinite(seconds, "seconds");
  return Math.max(0, speed) * Math.max(0, seconds);
}

/**
 * Robotun durma mesafesi: durma kararı verildikten sonra fiilen durana kadar
 * aldığı yol. Sabit hız varsayımıyla üst sınır verir (gerçek frenlemede hız
 * azaldığı için gerçek mesafe bundan küçüktür — güvenli tarafta kalır).
 */
export function stoppingDistance(robotSpeed: number, brakingTime: number): number {
  return travelDistance(robotSpeed, brakingTime);
}

/**
 * Gerekli en küçük ayrım mesafesi. İki taraf da toplam durma süresi
 * (tepki + frenleme) boyunca hareket eder; ikisinin yolu ve belirsizlik payı
 * toplanır.
 */
export function requiredSeparation(input: SeparationInput): SeparationResult {
  const totalTime = Math.max(0, input.reactionTime) + Math.max(0, input.brakingTime);
  const humanTravel = travelDistance(input.humanSpeed, totalTime);
  const robotTravel = travelDistance(input.robotSpeed, totalTime);
  const uncertainty = Math.max(0, input.uncertainty);
  return {
    humanTravel,
    robotTravel,
    uncertainty,
    required: humanTravel + robotTravel + uncertainty,
  };
}

/**
 * Ölçülen ayrım mesafesinin hangi bölgeye düştüğü.
 * - `dur`: gerekli mesafenin altında — robot durmalı.
 * - `yavasla`: gerekli mesafenin `warningFactor` katının altında — uyarı bölgesi.
 * - `serbest`: yeterince uzak.
 */
export function zoneState(measured: number, required: number, warningFactor = 2): ZoneState {
  if (measured < required) return "dur";
  if (measured < required * warningFactor) return "yavasla";
  return "serbest";
}

/**
 * Verilen ayrım mesafesinde izin verilen en yüksek robot hızı.
 * `requiredSeparation`'ın robot hızına göre tersidir: mesafe daraldıkça
 * izin verilen hız düşer, gerekli mesafenin altına inince sıfırlanır.
 */
export function allowedSpeed(
  measured: number,
  input: Omit<SeparationInput, "robotSpeed">,
): number {
  const totalTime = Math.max(0, input.reactionTime) + Math.max(0, input.brakingTime);
  if (totalTime === 0) return 0;
  const humanTravel = travelDistance(input.humanSpeed, totalTime);
  const budget = measured - humanTravel - Math.max(0, input.uncertainty);
  if (budget <= 0) return 0;
  return budget / totalTime;
}
