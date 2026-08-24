/**
 * "Aynı komutu farklı hedefe genelle" — Temel → Orta geçiş kapısı.
 *
 * docs/durum-codex.md "Teşhis" tablosu: her aşama sonuna bağlamı
 * değiştiren (sayı değil) bir kör transfer görevi konmalı. Temel
 * aşamasının 4 modülü hep TEK, hardcoded bir hedefe (`robot.movej([90,
 * -60])` gibi) kod yazdırıyordu — parametreleştirme kavramı hiç
 * görünmüyordu. Bu, o kavramı İLK kez tanıtan, Orta aşamanın
 * "değişkenler"ine doğal bir köprü kuran minimal bir kapı.
 *
 * Aynı sıfır-yeni-worker-API ilkesi: `robot.movej` zaten var, `jointTrace`
 * zaten var. Enjekte edilen tek şey hedef açı değişkenleri.
 */

export interface KodaParametreSenaryo {
  id: string;
  gizli: boolean;
  hedefJ1Derece: number;
  hedefJ2Derece: number;
}

export const KODA_PARAMETRE_TOLERANS_DERECE = 1;

export const KODA_PARAMETRE_SENARYOLARI: readonly KodaParametreSenaryo[] = [
  { id: "gorunur", gizli: false, hedefJ1Derece: 90, hedefJ2Derece: -60 },
  { id: "gizli-transfer", gizli: true, hedefJ1Derece: 30, hedefJ2Derece: -75 },
];

export function buildParametrePreamble(senaryo: KodaParametreSenaryo): string {
  return `HEDEF_J1 = ${senaryo.hedefJ1Derece}\nHEDEF_J2 = ${senaryo.hedefJ2Derece}\n`;
}

export function buildParametreCode(senaryo: KodaParametreSenaryo, ogrenciKodu: string): string {
  return buildParametrePreamble(senaryo) + "\n" + ogrenciKodu;
}

export interface KodaParametreCalismaSonucu {
  error: string | null;
  jointTrace: readonly number[][];
}

export interface KodaParametreDegerlendirmesi {
  senaryoId: string;
  gecti: boolean;
  gerekce: string;
}

export function evaluateKodaParametreSenaryo(
  senaryo: KodaParametreSenaryo,
  sonuc: KodaParametreCalismaSonucu,
): KodaParametreDegerlendirmesi {
  if (sonuc.error !== null) {
    return { senaryoId: senaryo.id, gecti: false, gerekce: `Kod hata verdi: ${sonuc.error}` };
  }
  const sonAcilarRad = sonuc.jointTrace.at(-1);
  if (!sonAcilarRad || sonAcilarRad.length !== 2) {
    return { senaryoId: senaryo.id, gecti: false, gerekce: "Robot hiç hareket etmedi (jointTrace boş)." };
  }
  const gercekJ1 = (sonAcilarRad[0] * 180) / Math.PI;
  const gercekJ2 = (sonAcilarRad[1] * 180) / Math.PI;
  const gecti =
    Math.abs(gercekJ1 - senaryo.hedefJ1Derece) <= KODA_PARAMETRE_TOLERANS_DERECE &&
    Math.abs(gercekJ2 - senaryo.hedefJ2Derece) <= KODA_PARAMETRE_TOLERANS_DERECE;
  return {
    senaryoId: senaryo.id,
    gecti,
    gerekce: gecti
      ? "Robot doğru hedefe ulaştı."
      : `Beklenen J1=${senaryo.hedefJ1Derece}°, J2=${senaryo.hedefJ2Derece}° — gerçek J1=${gercekJ1.toFixed(1)}°, J2=${gercekJ2.toFixed(1)}°.`,
  };
}
