"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

interface InlineNotProps {
  /** Buton olarak render edilen, her zaman görünen tetikleyici (terim metni, "Neden?" vb.). */
  tetikleyici: ReactNode;
  /** Yalnız açıkken görünen içerik. */
  children: ReactNode;
  /** Buton için ek sınıf (görsel farklılaştırma — ör. Terim vs Neden). */
  tetikleyiciClassName?: string;
  /**
   * Panel varsayılan açık mı başlasın (varsayılan false — mevcut davranış).
   * Faz 7 dikey dilimi: Mühendislik modunda Neden panelleri tıklamaya
   * gerek kalmadan açık gelsin diye eklendi (bkz. IkTarget.tsx).
   */
  baslangicAcik?: boolean;
}

/**
 * `TerimInline` (Faz 3) ve `Neden` (Faz 4) arasında paylaşılan açılıp-
 * kapanma ilkeli: buton + satır-içi (inline) akışa eklenen içerik.
 *
 * Floating/absolute-positioned bir popover DEĞİL, bilinçli olarak: mobilde
 * (docs/05 "mobil ilk sınıf vatandaş") kenar taşması hesaplamadan, her
 * viewport genişliğinde aynı şekilde çalışan tek yol satır-içi akışa yeni
 * metin eklemek — açıldığında çevredeki metin normal şekilde bir alt
 * satıra kayar, hiçbir konumlandırma mantığı gerekmez.
 */
export function InlineNot({ tetikleyici, children, tetikleyiciClassName = "", baslangicAcik = false }: InlineNotProps) {
  const [acik, setAcik] = useState(baslangicAcik);
  const notId = useId();

  // baslangicAcik yalnız ilk render'da useState'in başlangıç değeri olarak
  // okunur — mod değişince (ör. Öğren → Mühendislik) panel zaten monteliyse
  // bu olmadan tepki vermezdi.
  useEffect(() => {
    function syncFromMode() {
      setAcik(baslangicAcik);
    }
    syncFromMode();
  }, [baslangicAcik]);

  return (
    <span className="whitespace-normal">
      <button
        type="button"
        onClick={() => setAcik((deger) => !deger)}
        aria-expanded={acik}
        aria-controls={notId}
        className={`cursor-help underline decoration-dotted underline-offset-4 ${tetikleyiciClassName}`}
      >
        {tetikleyici}
      </button>
      {acik && (
        <span
          id={notId}
          role="note"
          aria-live="polite"
          className="mx-1 inline-block rounded-lg border border-current/15 bg-current/5 px-2 py-1 align-middle text-sm"
        >
          {children}
        </span>
      )}
    </span>
  );
}
