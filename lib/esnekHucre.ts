/**
 * "Esnek Hücreyi Devreye Al" — Kod Akademisi'nin Usta ötesi kapanış projesi.
 *
 * Kaynak: docs/durum-codex.md "Usta ötesi kapanış projesi" (2026-08-24,
 * Mert'in onayladığı plan). Öğrenci, iş emirlerini alıp parçayı hedeflere
 * taşıyan, hatayı güvenli duruma çeken ve davranışını testlerle kanıtlayan
 * BİR Python dosyası yazar — altı teslim taşı aynı dosyayı büyütür.
 *
 * Mimari karar: YENİ bir worker/backend API'si YOK. `robot.movej`/`movel`
 * (mevcut, hiç değişmeyen `pyodideWorker.ts`) zaten hata durumunda
 * `RobotHatasi` fırlatıyor ve her hareketi `jointTrace`'e satır numarasıyla
 * kaydediyor — bu iki mevcut yetenek "hedefe ulaşamama" ve "hareket sırası"
 * için yeterli kanıt zaten üretiyor. Tek eklenen şey, kullanıcı kodunun
 * ÖNÜNE eklenen SAF PYTHON bir `Hucre` sınıfı (bkz. `buildPreamble`) — bu da
 * worker'a değil, doğrudan `code` string'ine ekleniyor. Durum makinesi
 * gözlemlenebilirliği `print()` ile sağlanıyor (zaten yakalanan `stdout`),
 * ayrıştırma bu dosyadaki saf `parseDurumGecmisi`/`parseHatalar`'da.
 */

export interface EsnekHucreHedef {
  x: number;
  y: number;
  z: number;
}

export interface EsnekHucreIsEmri {
  parcaTuru: string;
  hedefler: readonly EsnekHucreHedef[];
}

export type EsnekHucreBeklenenSonuc = "tamamlandi" | "reddedildi" | "ariza-sonrasi-guvenli";

export interface EsnekHucreSenaryo {
  id: string;
  gizli: boolean;
  aciklama: string;
  isEmri: EsnekHucreIsEmri;
  /** `hucre.sensor_onayi_bekle()` bu senaryoda ne döndürür. */
  sensorOnayi: boolean;
  beklenenSonuc: EsnekHucreBeklenenSonuc;
}

/**
 * Öğrencinin milestone 2'de (İş emrini doğrula) yazacağı sabit kural.
 * MDX içeriğinde de birebir bu liste/aralık gösterilir — senaryolar bu
 * kurala göre kasıtlı geçerli/geçersiz kurulmuştur.
 */
export const GECERLI_PARCA_TURLERI: readonly string[] = ["kutu", "silindir", "tepsi"];
export const HEDEF_SAYISI_ARALIGI = { min: 1, max: 4 } as const;

/**
 * 3 görünür + 2 gizli, deterministik senaryo. `generic-2dof` kolunun erişimi
 * (bkz. lib/robotics/robots/genericTwoDof.ts: a1=1.0, a2=0.8 → erişim
 * 0.2–1.8 m) fixture'ların "ulaşılabilir"/"ulaşılamaz" ayrımının temelidir.
 */
export const ESNEK_HUCRE_SENARYOLARI: readonly EsnekHucreSenaryo[] = [
  {
    id: "gorev-1-normal",
    gizli: false,
    aciklama: "Geçerli bir iş emri, iki ulaşılabilir hedef, sensör onayı geliyor.",
    isEmri: { parcaTuru: "kutu", hedefler: [{ x: 0.5, y: 0.5, z: 0 }, { x: -0.5, y: 0.8, z: 0 }] },
    sensorOnayi: true,
    beklenenSonuc: "tamamlandi",
  },
  {
    id: "gorev-2-gecersiz-parca",
    gizli: false,
    aciklama: "Parça türü tanınmıyor ('civi') — robot hiç hareket etmeden reddetmeli.",
    isEmri: { parcaTuru: "civi", hedefler: [{ x: 0.5, y: 0.5, z: 0 }] },
    sensorOnayi: true,
    beklenenSonuc: "reddedildi",
  },
  {
    id: "gorev-3-onay-gelmiyor",
    gizli: false,
    aciklama: "İş emri geçerli ama sensör onayı hiç gelmiyor — güvenli duruşa geçmeli.",
    isEmri: { parcaTuru: "silindir", hedefler: [{ x: 0.6, y: -0.4, z: 0 }] },
    sensorOnayi: false,
    beklenenSonuc: "ariza-sonrasi-guvenli",
  },
  {
    id: "gorev-4-erisilemeyen-hedef",
    gizli: true,
    aciklama: "İkinci hedef robotun erişim alanı dışında — istisna güvenli duruşa çevrilmeli.",
    isEmri: { parcaTuru: "kutu", hedefler: [{ x: 0.5, y: 0.5, z: 0 }, { x: 5, y: 5, z: 0 }] },
    sensorOnayi: true,
    beklenenSonuc: "ariza-sonrasi-guvenli",
  },
  {
    id: "gorev-5-transfer",
    gizli: true,
    aciklama: "Farklı parça türü ve üç hedefli yeni bir iş emri — aynı mantık genellenmeli.",
    isEmri: {
      parcaTuru: "tepsi",
      hedefler: [{ x: 0.3, y: 0.3, z: 0 }, { x: 0.8, y: -0.3, z: 0 }, { x: -0.6, y: 0.6, z: 0 }],
    },
    sensorOnayi: true,
    beklenenSonuc: "tamamlandi",
  },
];

function pythonFloat(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

function pythonStringLiteral(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function isEmriToPythonDict(isEmri: EsnekHucreIsEmri): string {
  const hedefler = isEmri.hedefler
    .map((h) => `{"x": ${pythonFloat(h.x)}, "y": ${pythonFloat(h.y)}, "z": ${pythonFloat(h.z)}}`)
    .join(", ");
  return `{"parca_turu": ${pythonStringLiteral(isEmri.parcaTuru)}, "hedefler": [${hedefler}]}`;
}

/**
 * Senaryoyu, öğrencinin kodundan ÖNCE çalışacak saf Python'a çevirir.
 * `hucre` yalnız GÖZLEMLENEBİLİRLİK sağlar (`print` ile durum/hata
 * bildirimi) — doğrulama, durum geçişi, hareket kararı TAMAMEN öğrencinin
 * kodunda kalır. Worker'a hiçbir yeni alan eklenmedi; bu düz bir metin
 * ön-eki, `code` string'ine `+` ile eklenir.
 */
export function buildEsnekHucrePreamble(senaryo: EsnekHucreSenaryo): string {
  const sensorDeger = senaryo.sensorOnayi ? "True" : "False";
  return (
    "class Hucre:\n" +
    "    def __init__(self, sensor_onay):\n" +
    "        self._sensor_onay = sensor_onay\n" +
    "        self.gecmis = []\n" +
    "    def durum_gec(self, yeni):\n" +
    "        self.gecmis.append(yeni)\n" +
    '        print("DURUM:" + str(yeni))\n' +
    "    def sensor_onayi_bekle(self):\n" +
    "        return self._sensor_onay\n" +
    "    def hata_bildir(self, sebep):\n" +
    "        self.gecmis.append('hata:' + str(sebep))\n" +
    '        print("HATA:" + str(sebep))\n' +
    `hucre = Hucre(${sensorDeger})\n` +
    `IS_EMRI = ${isEmriToPythonDict(senaryo.isEmri)}\n`
  );
}

export function buildEsnekHucreCode(senaryo: EsnekHucreSenaryo, ogrenciKodu: string): string {
  return buildEsnekHucrePreamble(senaryo) + "\n" + ogrenciKodu;
}

const DURUM_SATIRI = /^DURUM:(.+)$/;
const HATA_SATIRI = /^HATA:(.+)$/;

export function parseDurumGecmisi(stdout: string): string[] {
  return stdout
    .split("\n")
    .map((line) => DURUM_SATIRI.exec(line.trim())?.[1])
    .filter((value): value is string => value !== undefined);
}

export function parseHatalar(stdout: string): string[] {
  return stdout
    .split("\n")
    .map((line) => HATA_SATIRI.exec(line.trim())?.[1])
    .filter((value): value is string => value !== undefined);
}

export interface EsnekHucreCalismaSonucu {
  stdout: string;
  error: string | null;
  jointTrace: readonly number[][];
}

export interface EsnekHucreSenaryoDegerlendirmesi {
  senaryoId: string;
  gecti: boolean;
  gerekce: string;
  durumGecmisi: string[];
  hatalar: string[];
  hareketSayisi: number;
}

/**
 * Tek bir senaryonun çalışma sonucunu değerlendirir. Kaynak kodu METNİNE
 * bakmaz — yalnız GÖZLENEBİLİR davranışa: durum geçmişi, hata bildirimleri,
 * gerçek robot hareketi sayısı ve worker'ın hiç yakalanmamış bir Python
 * istisnası bildirip bildirmediği.
 */
export function evaluateEsnekHucreSenaryo(
  senaryo: EsnekHucreSenaryo,
  sonuc: EsnekHucreCalismaSonucu,
): EsnekHucreSenaryoDegerlendirmesi {
  const durumGecmisi = parseDurumGecmisi(sonuc.stdout);
  const hatalar = parseHatalar(sonuc.stdout);
  const hareketSayisi = sonuc.jointTrace.length;
  const sonDurum = durumGecmisi.at(-1);

  // Yakalanmamış bir Python istisnası (worker.error dolu) HER ZAMAN
  // başarısızlıktır — hangi senaryo olursa olsun, "açıklanabilir hata"
  // gereksinimi tam olarak bunu ölçer: hata sızmamalı, hucre.hata_bildir
  // ile bildirilmeli.
  return evaluateInternal(senaryo, { durumGecmisi, hatalar, hareketSayisi, sonDurum, error: sonuc.error });
}

function evaluateInternal(
  senaryo: EsnekHucreSenaryo,
  ozet: { durumGecmisi: string[]; hatalar: string[]; hareketSayisi: number; sonDurum: string | undefined; error: string | null },
): EsnekHucreSenaryoDegerlendirmesi {
  const { durumGecmisi, hatalar, hareketSayisi, sonDurum, error } = ozet;
  const beklenenHedefSayisi = senaryo.isEmri.hedefler.length;

  if (error !== null) {
    return {
      senaryoId: senaryo.id,
      gecti: false,
      gerekce: `Kod yakalanmamış bir hata fırlattı: ${error}`,
      durumGecmisi,
      hatalar,
      hareketSayisi,
    };
  }

  if (senaryo.beklenenSonuc === "tamamlandi") {
    const gecti = sonDurum === "tamamlandi" && hareketSayisi === beklenenHedefSayisi && hatalar.length === 0;
    return {
      senaryoId: senaryo.id,
      gecti,
      gerekce: gecti
        ? "Tüm hedeflere sırayla ulaşıldı, iş tamamlandı olarak işaretlendi."
        : `Beklenen: son durum "tamamlandi" ve ${beklenenHedefSayisi} hareket, hatasız. Gerçek: son durum "${sonDurum ?? "yok"}", ${hareketSayisi} hareket, ${hatalar.length} hata bildirimi.`,
      durumGecmisi,
      hatalar,
      hareketSayisi,
    };
  }

  if (senaryo.beklenenSonuc === "reddedildi") {
    const gecti = sonDurum === "reddedildi" && hareketSayisi === 0;
    return {
      senaryoId: senaryo.id,
      gecti,
      gerekce: gecti
        ? "Geçersiz iş emri, robot hiç hareket etmeden reddedildi."
        : `Beklenen: son durum "reddedildi" ve 0 hareket. Gerçek: son durum "${sonDurum ?? "yok"}", ${hareketSayisi} hareket.`,
      durumGecmisi,
      hatalar,
      hareketSayisi,
    };
  }

  // "ariza-sonrasi-guvenli": en az bir hata bildirimi var, son durum
  // "running"/"tamamlandi" DEĞİL (yarıda kesilmiş bir işi başarılı gibi
  // göstermiyor), ve tüm hedeflere ulaşılmamış olmalı.
  const guvenliSonDurumlar = new Set(["fault", "ariza", "idle"]);
  const gecti =
    hatalar.length > 0 &&
    sonDurum !== undefined &&
    guvenliSonDurumlar.has(sonDurum) &&
    hareketSayisi < beklenenHedefSayisi;
  return {
    senaryoId: senaryo.id,
    gecti,
    gerekce: gecti
      ? "Arıza tespit edilip bildirildi, robot güvenli bir son durumda kaldı."
      : `Beklenen: en az bir HATA bildirimi ve güvenli bir son durum (fault/idle), tüm hedeflere ulaşılmamış olmalı. Gerçek: ${hatalar.length} hata, son durum "${sonDurum ?? "yok"}", ${hareketSayisi}/${beklenenHedefSayisi} hareket.`,
    durumGecmisi,
    hatalar,
    hareketSayisi,
  };
}
