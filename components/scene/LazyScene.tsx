"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 3D sahnelerin tembel (lazy) yüklenmesi.
 *
 * Neden gerekli: `three` + `@react-three/fiber` + `@react-three/drei`
 * birlikte ~250 KB (gzip) tutuyor. Doğrudan import edildiklerinde bu ağırlık
 * ders sayfasının İLK yükleme paketine giriyordu — ölçüldü: 434 KB, oysa
 * docs/05 Bölüm 3'teki bütçe 200 KB. `next/dynamic` ile ayrı bir parçaya
 * (chunk) alınınca ilk paket bütçeye iniyor, 3D sahne sayfa etkileşime
 * hazır olduktan sonra geliyor.
 *
 * `ssr: false`: sahneler zaten tarayıcıya özgü (WebGL); statik dışa
 * aktarımda sunucuda render edilmelerinin bir anlamı yok.
 *
 * Yükleme sırasında iskelet gösteriliyor (docs/04: "yükleme 1 saniyeden uzun
 * sürecekse iskelet göster").
 */

function SahneIskeleti() {
  return (
    <div
      role="status"
      className="flex h-full w-full items-center justify-center bg-black/5 text-sm text-black/50"
    >
      Sahne yükleniyor…
    </div>
  );
}

// Üçü de aynı modülü (./scenes) işaret ediyor — bu bilinçli, tek bir tembel
// parça üretilsin diye (bkz. scenes.ts başlığı).
export const RobotArm = dynamic(() => import("./scenes").then((modul) => modul.RobotArm), {
  ssr: false,
  loading: SahneIskeleti,
});

export const PlanningGrid = dynamic(() => import("./scenes").then((modul) => modul.PlanningGrid), {
  ssr: false,
  loading: SahneIskeleti,
});

export const JacobianScene = dynamic(() => import("./scenes").then((modul) => modul.JacobianScene), {
  ssr: false,
  loading: SahneIskeleti,
});

interface SahneAlaniProps {
  /** Sahne kutusunun boyut/renk sınıfları. */
  className?: string;
  children: ReactNode;
}

/**
 * 3D sahnenin yerleştiği kutu. İki iş yapar:
 *
 * 1. Sahneyi ekran okuyucudan gizler (`aria-hidden`). Canvas'ın içi
 *    erişilebilir değil; her sahnenin bilgi içeriği kaydırıcı etiketlerinde ve
 *    metin özetinde ayrıca veriliyor (docs/02 erişilebilirlik).
 * 2. Sahneyi ancak görünür alana YAKLAŞTIĞINDA bağlar. Ders sayfalarında
 *    genelde birden fazla sahne var; hepsini birden başlatmak sayfa
 *    yüklenirken ana thread'i kilitliyordu (Lighthouse mobil: TBT 1190 ms).
 *    Ekranda olmayan sahne hiç kurulmaz — kullanıcı oraya kaydırınca kurulur.
 *
 * IntersectionObserver desteklenmiyorsa sahne doğrudan bağlanır (bozulma yok).
 */
export function SahneAlani({ className, children }: SahneAlaniProps) {
  const kutuRef = useRef<HTMLDivElement>(null);
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    const kutu = kutuRef.current;
    if (!kutu) return;
    if (typeof IntersectionObserver === "undefined") {
      // Efekt gövdesinde doğrudan setState çağırmak zincirleme render üretir
      // (react-hooks/set-state-in-effect); bir sonraki tik'e bırakılıyor.
      const zamanlayici = setTimeout(() => setGorunur(true), 0);
      return () => clearTimeout(zamanlayici);
    }

    const gozlemci = new IntersectionObserver(
      (girisler) => {
        if (girisler.some((giris) => giris.isIntersecting)) {
          setGorunur(true);
          gozlemci.disconnect();
        }
      },
      // Kullanıcı sahneye ulaşmadan biraz önce yüklensin ki hazır bulsun.
      { rootMargin: "300px" },
    );
    gozlemci.observe(kutu);
    return () => gozlemci.disconnect();
  }, []);

  return (
    <div ref={kutuRef} aria-hidden="true" className={className}>
      {gorunur ? children : <SahneIskeleti />}
    </div>
  );
}
