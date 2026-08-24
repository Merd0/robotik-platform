/**
 * "Satırdan poza: izle, tahmin et, düzelt" — İleri → Usta geçiş kapısı.
 *
 * Kaynak: docs/guncel-fikirler.md §13 "Lab 2 — Python: tahmin et, izle,
 * düzelt", docs/durum-codex.md'nin genelleme kararı: Hat D'ye bağlı bir
 * kopya DEĞİL, satır-pozu-iz eşlemesini (zaten var olan Madde 9 özelliği —
 * `lib/pythonCodeEditor.ts`'teki `activeTraceLine`) kullanan, kör transferli
 * bağımsız bir Kod Akademisi modülü.
 *
 * Mimari, `lib/esnekHucre.ts` ile AYNI ilke: sıfır yeni worker API'si.
 * `robot.hedefe_git(x, y)` (mevcut, generic-2dof için zaten enjekte edilen
 * IK köprüsü) ve `jointTrace` (mevcut) yeterli. Tek eklenen şey, hedef
 * koordinatları öğrencinin kodunun ÖNÜNE enjekte eden bir Python öneki.
 *
 * "Kör transfer": öğrenci hatayı GÖRÜNÜR senaryoda düzeltip son hedefi
 * doğrudan sabit sayı olarak yazarsa (parametreleri kullanmak yerine),
 * GİZLİ senaryo (farklı koordinatlar) başarısız olur — bu, ezberlemeyi
 * değil genellemeyi ölçer.
 */

export interface TransferHedef {
  x: number;
  y: number;
}

export interface KodaTransferSenaryo {
  id: string;
  gizli: boolean;
  hedef1: TransferHedef;
  hedef2: TransferHedef;
  /** hedef2'nin analitik IK çözümü (derece) — bkz. bu dosyanın test dosyasındaki türetme notu. */
  beklenenSonAcilarDeg: readonly [number, number];
}

export const KODA_TRANSFER_TOLERANS_DERECE = 0.5;

export const KODA_TRANSFER_SENARYOLARI: readonly KodaTransferSenaryo[] = [
  {
    id: "gorunur",
    gizli: false,
    hedef1: { x: 0.9, y: 0.3 },
    hedef2: { x: -0.5, y: 0.8 },
    beklenenSonAcilarDeg: [73.496, 117.953],
  },
  {
    id: "gizli-transfer",
    gizli: true,
    hedef1: { x: 0.3, y: -0.6 },
    hedef2: { x: 0.7, y: 0.2 },
    beklenenSonAcilarDeg: [-36.374, 133.928],
  },
];

function pythonFloat(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

export function buildKodaTransferPreamble(senaryo: KodaTransferSenaryo): string {
  return (
    `HEDEF_X1 = ${pythonFloat(senaryo.hedef1.x)}\n` +
    `HEDEF_Y1 = ${pythonFloat(senaryo.hedef1.y)}\n` +
    `HEDEF_X2 = ${pythonFloat(senaryo.hedef2.x)}\n` +
    `HEDEF_Y2 = ${pythonFloat(senaryo.hedef2.y)}\n`
  );
}

export function buildKodaTransferCode(senaryo: KodaTransferSenaryo, ogrenciKodu: string): string {
  return buildKodaTransferPreamble(senaryo) + "\n" + ogrenciKodu;
}

export interface KodaTransferCalismaSonucu {
  error: string | null;
  jointTrace: readonly number[][];
}

export interface KodaTransferDegerlendirmesi {
  senaryoId: string;
  gecti: boolean;
  gerekce: string;
}

export function evaluateKodaTransferSenaryo(
  senaryo: KodaTransferSenaryo,
  sonuc: KodaTransferCalismaSonucu,
): KodaTransferDegerlendirmesi {
  if (sonuc.error !== null) {
    return { senaryoId: senaryo.id, gecti: false, gerekce: `Kod hata verdi: ${sonuc.error}` };
  }
  const sonAcilarRad = sonuc.jointTrace.at(-1);
  if (!sonAcilarRad || sonAcilarRad.length !== 2) {
    return { senaryoId: senaryo.id, gecti: false, gerekce: "Robot hiç hareket etmedi (jointTrace boş)." };
  }
  const [beklenen1, beklenen2] = senaryo.beklenenSonAcilarDeg;
  const gercek1 = (sonAcilarRad[0] * 180) / Math.PI;
  const gercek2 = (sonAcilarRad[1] * 180) / Math.PI;
  const gecti =
    Math.abs(gercek1 - beklenen1) <= KODA_TRANSFER_TOLERANS_DERECE &&
    Math.abs(gercek2 - beklenen2) <= KODA_TRANSFER_TOLERANS_DERECE;
  return {
    senaryoId: senaryo.id,
    gecti,
    gerekce: gecti
      ? "Son poz beklenen hedefle eşleşti."
      : `Beklenen son açı ${beklenen1.toFixed(1)}°, ${beklenen2.toFixed(1)}° — gerçek ${gercek1.toFixed(1)}°, ${gercek2.toFixed(1)}°.`,
  };
}
