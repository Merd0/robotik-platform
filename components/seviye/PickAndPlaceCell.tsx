"use client";

import { useEffect, useState } from "react";

/*
 * Seviye giriş sayfalarındaki "canlı hücre": kendi kendine çalışan bir
 * al-taşı-bırak döngüsü. Kullanıcı girdisi almaz — sayfanın "burada bir şey
 * çalışıyor" sinyalidir, dersin kendisi değil.
 *
 * Kol konumu elle çizilmiş kare kare animasyon değil, gerçek iki uzuvlu ters
 * kinematikle hesaplanıyor: faz makinesi hedef NOKTAYI söyler, açıları IK
 * bulur. Bu bilinçli — sahnede gösterdiğimiz hareketin, derste anlattığımız
 * matematikten üretilmesi gerekiyor (docs/06 Katman 1'in görsel karşılığı).
 */

const L1 = 58;
const L2 = 52;
const TABAN = { x: 55, y: 142 };

const NOKTALAR = {
  alisYaklas: { x: 92, y: 100 },
  alisNoktasi: { x: 92, y: 134 },
  kaldir: { x: 92, y: 96 },
  yayOrtasi: { x: 110, y: 58 },
  birakYaklas: { x: 150, y: 96 },
  birakNoktasi: { x: 150, y: 134 },
  bekleme: { x: 100, y: 75 },
} as const;

type NoktaAdi = keyof typeof NOKTALAR;

interface Faz {
  nokta: NoktaAdi;
  sure: number;
  tutuyor: boolean;
  ceneKapali: boolean;
  kutuYeri: "alis" | "birak";
  kutuGorunur: boolean;
}

const FAZLAR: Faz[] = [
  { nokta: "alisYaklas", sure: 900, tutuyor: false, ceneKapali: false, kutuYeri: "alis", kutuGorunur: true },
  { nokta: "alisNoktasi", sure: 600, tutuyor: false, ceneKapali: false, kutuYeri: "alis", kutuGorunur: true },
  { nokta: "alisNoktasi", sure: 350, tutuyor: false, ceneKapali: true, kutuYeri: "alis", kutuGorunur: true },
  { nokta: "alisNoktasi", sure: 60, tutuyor: true, ceneKapali: true, kutuYeri: "alis", kutuGorunur: false },
  { nokta: "kaldir", sure: 650, tutuyor: true, ceneKapali: true, kutuYeri: "alis", kutuGorunur: false },
  { nokta: "yayOrtasi", sure: 750, tutuyor: true, ceneKapali: true, kutuYeri: "alis", kutuGorunur: false },
  { nokta: "birakYaklas", sure: 750, tutuyor: true, ceneKapali: true, kutuYeri: "alis", kutuGorunur: false },
  { nokta: "birakNoktasi", sure: 600, tutuyor: true, ceneKapali: true, kutuYeri: "alis", kutuGorunur: false },
  { nokta: "birakNoktasi", sure: 350, tutuyor: true, ceneKapali: false, kutuYeri: "alis", kutuGorunur: false },
  { nokta: "birakNoktasi", sure: 60, tutuyor: false, ceneKapali: false, kutuYeri: "birak", kutuGorunur: true },
  { nokta: "bekleme", sure: 900, tutuyor: false, ceneKapali: false, kutuYeri: "birak", kutuGorunur: true },
  { nokta: "bekleme", sure: 900, tutuyor: false, ceneKapali: false, kutuYeri: "birak", kutuGorunur: true },
  { nokta: "bekleme", sure: 400, tutuyor: false, ceneKapali: false, kutuYeri: "birak", kutuGorunur: false },
  { nokta: "bekleme", sure: 60, tutuyor: false, ceneKapali: false, kutuYeri: "alis", kutuGorunur: false },
  { nokta: "bekleme", sure: 400, tutuyor: false, ceneKapali: false, kutuYeri: "alis", kutuGorunur: true },
  { nokta: "bekleme", sure: 700, tutuyor: false, ceneKapali: false, kutuYeri: "alis", kutuGorunur: true },
];

/** İki uzuvlu analitik IK; dirsek-yukarı dalı seçilir (SVG'de küçük y = yukarı). */
function ik(hedef: { x: number; y: number }) {
  let dx = hedef.x - TABAN.x;
  let dy = hedef.y - TABAN.y;
  let d = Math.hypot(dx, dy);
  const enUzak = L1 + L2 - 1;
  const enYakin = Math.abs(L1 - L2) + 1;
  if (d > enUzak) {
    const olcek = enUzak / d;
    dx *= olcek;
    dy *= olcek;
    d = enUzak;
  }
  if (d < enYakin) {
    const olcek = enYakin / (d || 1);
    dx *= olcek;
    dy *= olcek;
    d = enYakin;
  }
  const cosT2 = Math.max(-1, Math.min(1, (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2)));
  const aci = Math.acos(cosT2);
  const hedefeAci = Math.atan2(dy, dx);
  const dallar = [aci, -aci].map((theta2) => {
    const theta1 = hedefeAci - Math.atan2(L2 * Math.sin(theta2), L1 + L2 * Math.cos(theta2));
    return { theta1, theta2, dirsekY: TABAN.y + L1 * Math.sin(theta1) };
  });
  const secilen = dallar[0].dirsekY <= dallar[1].dirsekY ? dallar[0] : dallar[1];
  const derece = (radyan: number) => Math.round(((radyan * 180) / Math.PI) * 100) / 100;
  return { theta1: derece(secilen.theta1), theta2: derece(secilen.theta2) };
}

function kutuParcalari(x: number, y: number) {
  return {
    ust: `${x},${y} ${x + 6},${y - 5} ${x + 24},${y - 5} ${x + 18},${y}`,
    yan: `${x + 18},${y} ${x + 24},${y - 5} ${x + 24},${y + 11} ${x + 18},${y + 16}`,
  };
}

export function PickAndPlaceCell({ eklemRengi, eklemKenari }: { eklemRengi: string; eklemKenari: string }) {
  const [faz, setFaz] = useState(0);

  useEffect(() => {
    // Azaltılmış hareket tercihinde döngü hiç başlamaz: kol temsili bir
    // duruşta donar, zamanlayıcı boşuna dönmez.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const zamanlayici = setTimeout(() => setFaz((oncekiFaz) => (oncekiFaz + 1) % FAZLAR.length), FAZLAR[faz].sure);
    return () => clearTimeout(zamanlayici);
  }, [faz]);

  const aktif = FAZLAR[faz];
  const { theta1, theta2 } = ik(NOKTALAR[aktif.nokta]);
  const duranKutu = aktif.kutuYeri === "alis" ? NOKTALAR.alisNoktasi : NOKTALAR.birakNoktasi;
  const duran = kutuParcalari(duranKutu.x, duranKutu.y);
  const tutulan = kutuParcalari(149, 134);
  const gecis = `transform ${aktif.sure}ms ease-in-out`;

  return (
    <svg
      viewBox="0 0 240 160"
      className="h-[150px] w-full"
      role="img"
      aria-label="Robot hücresi: iki eklemli kol bir kutuyu alır, taşır ve karşı taraftaki hedefe bırakır; eklem açıları her hedef için ters kinematikle hesaplanır."
    >
      <line x1="10" y1="150" x2="230" y2="150" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <ellipse cx={NOKTALAR.birakNoktasi.x + 9} cy="150" rx="16" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.4" />

      <g style={{ opacity: aktif.kutuGorunur ? 1 : 0, transition: "opacity 400ms ease" }}>
        <rect x={duranKutu.x} y={duranKutu.y} width="18" height="16" fill="#e8935a" stroke="#8c4a20" strokeWidth="1" />
        <polygon points={duran.ust} fill="#f6be8e" stroke="#8c4a20" strokeWidth="1" />
        <polygon points={duran.yan} fill="#b4622e" stroke="#8c4a20" strokeWidth="1" />
      </g>

      <rect x="42" y="142" width="26" height="9" rx="3" fill="var(--color-poster-soft)" stroke="currentColor" strokeWidth="1" opacity="0.85" />
      <ellipse cx="55" cy="142" rx="11" ry="4.5" fill="var(--color-poster-soft)" stroke="currentColor" strokeWidth="1" opacity="0.85" />
      <circle cx="55" cy="142" r="8.5" fill={eklemRengi} stroke={eklemKenari} strokeWidth="1.2" />

      <g style={{ transform: `rotate(${theta1}deg)`, transformOrigin: "55px 142px", transition: gecis }}>
        <rect x="55" y="135" width="58" height="14" rx="7" fill="var(--color-poster-soft)" stroke="currentColor" strokeWidth="1.2" opacity="0.95" />
        <circle cx="113" cy="142" r="9" fill={eklemRengi} stroke={eklemKenari} strokeWidth="1.2" />
        <g style={{ transform: `rotate(${theta2}deg)`, transformOrigin: "113px 142px", transition: gecis }}>
          <rect x="113" y="137" width="28" height="10" rx="5" fill="var(--color-poster-soft)" stroke="currentColor" strokeWidth="1.2" opacity="0.95" />
          <circle cx="141" cy="142" r="7" fill={eklemRengi} stroke={eklemKenari} strokeWidth="1.1" />
          <rect x="141" y="138" width="18" height="8" rx="4" fill="var(--color-poster-soft)" stroke="currentColor" strokeWidth="1.1" opacity="0.95" />
          <g style={{ opacity: aktif.tutuyor ? 1 : 0, transition: "opacity 200ms ease-out" }}>
            <rect x="149" y="134" width="18" height="16" fill="#e8935a" stroke="#8c4a20" strokeWidth="1" />
            <polygon points={tutulan.ust} fill="#f6be8e" stroke="#8c4a20" strokeWidth="1" />
            <polygon points={tutulan.yan} fill="#b4622e" stroke="#8c4a20" strokeWidth="1" />
          </g>
          <line x1="165" y1="142" x2="180" y2="132" stroke={eklemRengi} strokeWidth="4.5" strokeLinecap="round" style={{ transformOrigin: "165px 142px", transform: `rotate(${aktif.ceneKapali ? 14 : 0}deg)`, transition: "transform 300ms ease-in-out" }} />
          <line x1="165" y1="142" x2="180" y2="152" stroke={eklemRengi} strokeWidth="4.5" strokeLinecap="round" style={{ transformOrigin: "165px 142px", transform: `rotate(${aktif.ceneKapali ? -14 : 0}deg)`, transition: "transform 300ms ease-in-out" }} />
          <circle cx="165" cy="142" r="5.5" fill={eklemRengi} stroke={eklemKenari} strokeWidth="1" />
        </g>
      </g>
    </svg>
  );
}
