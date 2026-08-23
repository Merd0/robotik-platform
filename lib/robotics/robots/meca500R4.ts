import type { RobotSpec } from "../kinematics";

const deg = (value: number) => value * Math.PI / 180;

/**
 * Mecademic Meca500 R4'ün kaynaklı katalog tanımı.
 *
 * Tek sayısal kaynak: üreticinin kamuya açık MC-UM-MECA500 2026.B
 * dokümanındaki Tablo 7 ve Şekil 18:
 * https://resources.mecademic.com/en/doc/MC-UM-MECA500/2026.B/manual/technical-specifications.html
 *
 * - Tablo 7: eklem limitleri, R4 azami eklem hızları, payload ve flanşta
 *   azami erişim.
 * - Şekil 18: 135/135/38/120/70 mm bağlantı ve ofset ölçüleri; siyah
 *   çizim bütün eklemlerin 0° konumunu gösterir.
 *
 * Şekil 18'deki ardışık eklem eksenleri, `dhTransform`un kullandığı standart
 * DH düzenine (Rz(theta) Tz(d) Tx(a) Rx(alpha)) çevrilmiştir. Üretici sıfır
 * konumundaki dik ikinci kolu korumak için J2'nin sabit theta ofseti +90°'dir.
 * Uzunluklar platform sözleşmesi gereği mm'den metreye, açılar derece/radyan
 * birimlerinden radyana çevrilir; kaynakta olmayan hiçbir geometrik sayı yoktur.
 */
export const meca500R4Robot: RobotSpec = {
  id: "meca500-r4",
  displayName: "Mecademic Meca500 R4",
  joints: [
    {
      type: "revolute",
      dhParams: { a: 0, alpha: Math.PI / 2, d: 0.135, theta: 0 },
      limits: { min: deg(-175), max: deg(175) },
      maxVelocity: deg(225),
    },
    {
      type: "revolute",
      dhParams: { a: 0.135, alpha: 0, d: 0, theta: Math.PI / 2 },
      limits: { min: deg(-70), max: deg(90) },
      maxVelocity: deg(225),
    },
    {
      type: "revolute",
      dhParams: { a: 0.038, alpha: Math.PI / 2, d: 0, theta: 0 },
      limits: { min: deg(-135), max: deg(70) },
      maxVelocity: deg(225),
    },
    {
      type: "revolute",
      dhParams: { a: 0, alpha: -Math.PI / 2, d: 0.12, theta: 0 },
      limits: { min: deg(-170), max: deg(170) },
      maxVelocity: deg(350),
    },
    {
      type: "revolute",
      dhParams: { a: 0, alpha: Math.PI / 2, d: 0, theta: 0 },
      limits: { min: deg(-115), max: deg(115) },
      maxVelocity: deg(350),
    },
    {
      type: "revolute",
      dhParams: { a: 0, alpha: 0, d: 0.07, theta: 0 },
      limits: { min: deg(-36_000), max: deg(36_000) },
      maxVelocity: deg(500),
    },
  ],
  metadata: {
    manufacturer: "Mecademic",
    model: "Meca500 R4",
    maxReachMm: 330,
    payloadKg: 0.5,
    source: {
      kind: "official-doc",
      title: "MC-UM-MECA500 — Technical specifications, Table 7 and Figure 18",
      publisher: "Mecademic",
      url: "https://resources.mecademic.com/en/doc/MC-UM-MECA500/2026.B/manual/technical-specifications.html",
      version: "2026.B.277",
      accessedAt: "2026-08-23",
    },
  },
};
