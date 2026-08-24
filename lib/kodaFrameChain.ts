/**
 * "Çerçeve zincirini birleştir" — Usta sonrası uzmanlık stüdyosu.
 *
 * Kaynak: docs/guncel-fikirler.md §13 "Lab 4 — NumPy ile çerçeve zinciri",
 * docs/durum-codex.md'nin kararı: capstone öncesi zorunlu çekirdek DEĞİL,
 * Usta sonrası opsiyonel uzmanlık stüdyosu; "Şartnameden teste" biçiminde.
 *
 * Bilinçli sapma — NUMPY YOK: `scripts/copy-pyodide-assets.mjs` NumPy'ı
 * KASITLI OLARAK kopyalamıyor (harici CDN'den çekilmesi gerekirdi, bkz.
 * docs/08 "harici CDN yasak"; bir bilimsel paketi yerel olarak barındırmak
 * ayrı, büyük bir tedarik zinciri kararı olurdu — bkz. docs/08 "yeni
 * bağımlılık eklemeden önce gerekçelendir"). Aynı pedagojik hedef (kimlik,
 * ters/round-trip, değişmezlik-olmama, birleştirme sırası) SAF PYTHON 4×4
 * matris fonksiyonlarıyla (`mat_carp`, `nokta_donustur`, `rotz`,
 * `translation` — hepsi enjekte edilen önekte) karşılanıyor. Sıfır yeni
 * worker API'si ilkesi (esnekHucre.ts, kodaTransferGate.ts ile aynı) burada
 * da geçerli: robot API'sine bile ihtiyaç yok, düz `print()` çıktısı yeterli.
 *
 * Golden değerler bu dosyadan DEĞİL, `lib/robotics/transform.ts`'in zaten
 * test edilmiş `multiply`/`rotationZ`/`translation`/`transformPoint`
 * fonksiyonlarından (bağımsız oracle) türetilip test dosyasında o oracle'a
 * karşı doğrulanıyor.
 */

export interface FrameChainSenaryo {
  id: string;
  gizli: boolean;
  tabanX: number;
  tabanY: number;
  tabanAciRad: number;
  noktaX: number;
  noktaY: number;
  noktaZ: number;
  /** taban_to_world · nokta — bkz. bu dosyanın test dosyasındaki transform.ts oracle türetmesi. */
  beklenenDunyaNoktasi: readonly [number, number, number];
}

export const KODA_FRAME_CHAIN_TOLERANS = 1e-6;

export const KODA_FRAME_CHAIN_SENARYOLARI: readonly FrameChainSenaryo[] = [
  {
    id: "gorunur",
    gizli: false,
    tabanX: 1.0,
    tabanY: 0.0,
    tabanAciRad: Math.PI / 2,
    noktaX: 0.5,
    noktaY: 0.0,
    noktaZ: 0.0,
    beklenenDunyaNoktasi: [1.0, 0.5, 0.0],
  },
  {
    id: "gizli-transfer",
    gizli: true,
    tabanX: 0.0,
    tabanY: 2.0,
    tabanAciRad: Math.PI,
    noktaX: 1.0,
    noktaY: 0.0,
    noktaZ: 0.0,
    beklenenDunyaNoktasi: [-1.0, 2.0, 0.0],
  },
];

function pythonFloat(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

/**
 * Saf Python 4×4 matris yardımcıları + senaryo değişkenleri. `mat_carp`/
 * `nokta_donustur`/`rotz`/`translation` fonksiyonları ÖĞRENCİYE VERİLİR —
 * bug bunların İÇİNDE değil, öğrencinin bunları BİRLEŞTİRME SIRASINDA.
 */
export function buildFrameChainPreamble(senaryo: FrameChainSenaryo): string {
  return (
    "import math\n" +
    "def mat_carp(A, B):\n" +
    "    sonuc = [[0.0]*4 for _ in range(4)]\n" +
    "    for i in range(4):\n" +
    "        for j in range(4):\n" +
    "            for k in range(4):\n" +
    "                sonuc[i][j] += A[i][k] * B[k][j]\n" +
    "    return sonuc\n" +
    "def nokta_donustur(M, nokta):\n" +
    "    x, y, z = nokta\n" +
    "    v = [x, y, z, 1.0]\n" +
    "    sonuc = [sum(M[i][k]*v[k] for k in range(4)) for i in range(4)]\n" +
    "    return (sonuc[0], sonuc[1], sonuc[2])\n" +
    "def rotz(aci_rad):\n" +
    "    c, s = math.cos(aci_rad), math.sin(aci_rad)\n" +
    "    return [[c,-s,0.0,0.0],[s,c,0.0,0.0],[0.0,0.0,1.0,0.0],[0.0,0.0,0.0,1.0]]\n" +
    "def translation(x, y, z):\n" +
    "    return [[1.0,0.0,0.0,x],[0.0,1.0,0.0,y],[0.0,0.0,1.0,z],[0.0,0.0,0.0,1.0]]\n" +
    `TABAN_X = ${pythonFloat(senaryo.tabanX)}\n` +
    `TABAN_Y = ${pythonFloat(senaryo.tabanY)}\n` +
    `TABAN_ACI_RAD = ${senaryo.tabanAciRad}\n` +
    `NOKTA_X = ${pythonFloat(senaryo.noktaX)}\n` +
    `NOKTA_Y = ${pythonFloat(senaryo.noktaY)}\n` +
    `NOKTA_Z = ${pythonFloat(senaryo.noktaZ)}\n`
  );
}

export function buildFrameChainCode(senaryo: FrameChainSenaryo, ogrenciKodu: string): string {
  return buildFrameChainPreamble(senaryo) + "\n" + ogrenciKodu;
}

export interface FrameChainDegerlendirmesi {
  senaryoId: string;
  gecti: boolean;
  gerekce: string;
}

const NOKTA_SATIRI = /^(-?\d+\.?\d*(?:[eE][-+]?\d+)?),(-?\d+\.?\d*(?:[eE][-+]?\d+)?),(-?\d+\.?\d*(?:[eE][-+]?\d+)?)$/;

/** Öğrencinin `print(f"{x:.6f},{y:.6f},{z:.6f}")` çıktısını ayrıştırır — verilen kod bu formatı zaten içeriyor, öğrenci değiştirmez. */
export function parseDunyaNoktasi(stdout: string): [number, number, number] | null {
  const satir = stdout
    .split("\n")
    .map((line) => line.trim())
    .findLast((line) => NOKTA_SATIRI.test(line));
  if (!satir) return null;
  const eslesme = NOKTA_SATIRI.exec(satir)!;
  return [Number(eslesme[1]), Number(eslesme[2]), Number(eslesme[3])];
}

export interface FrameChainCalismaSonucu {
  error: string | null;
  stdout: string;
}

export function evaluateFrameChainSenaryo(
  senaryo: FrameChainSenaryo,
  sonuc: FrameChainCalismaSonucu,
): FrameChainDegerlendirmesi {
  if (sonuc.error !== null) {
    return { senaryoId: senaryo.id, gecti: false, gerekce: `Kod hata verdi: ${sonuc.error}` };
  }
  const nokta = parseDunyaNoktasi(sonuc.stdout);
  if (!nokta) {
    return { senaryoId: senaryo.id, gecti: false, gerekce: "Beklenen 'x,y,z' formatında bir çıktı bulunamadı." };
  }
  const [bx, by, bz] = senaryo.beklenenDunyaNoktasi;
  const [gx, gy, gz] = nokta;
  const gecti =
    Math.abs(gx - bx) <= KODA_FRAME_CHAIN_TOLERANS &&
    Math.abs(gy - by) <= KODA_FRAME_CHAIN_TOLERANS &&
    Math.abs(gz - bz) <= KODA_FRAME_CHAIN_TOLERANS;
  return {
    senaryoId: senaryo.id,
    gecti,
    gerekce: gecti
      ? "Dünya çerçevesindeki nokta doğru hesaplandı."
      : `Beklenen (${bx}, ${by}, ${bz}) — gerçek (${gx}, ${gy}, ${gz}).`,
  };
}
