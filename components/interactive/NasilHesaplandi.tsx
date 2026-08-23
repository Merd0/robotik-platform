import type { ReactNode } from "react";

interface NasilHesaplandiProps {
  /** Varsayılan "Nasıl hesaplandı?" — nadiren değiştirilir (ör. "Neden tekillik?"). */
  baslik?: string;
  /** Kapalıyken bile görünen, sade dilde tek satırlık özet. */
  ozet: ReactNode;
  /** Yalnız açıldığında görünen teknik detay (ham sayı, formül, iterasyon tablosu vb.). */
  children: ReactNode;
  className?: string;
  /**
   * Panel varsayılan açık mı başlasın (varsayılan false — mevcut davranış).
   * Faz 7 Öğren/Mühendislik modu: Mühendislik'te panel tıklamaya gerek
   * kalmadan açık gelsin diye eklendi (bkz. JacobianViz.tsx/DlsTraceLab.tsx).
   * `key`, native `<details>`in `open` özniteliğini yalnız İLK render'da
   * okuması sorununu çözer — mod değişince panel zaten monteliyse bu
   * olmadan tepki vermezdi (InlineNot'taki `baslangicAcik` useEffect'iyle
   * aynı gerekçe, farklı mekanizma — burada native element yeniden monte
   * edilerek çözülüyor).
   */
  varsayilanAcik?: boolean;
}

/**
 * Progressive disclosure için paylaşılan panel: `DlsTraceLab` ve
 * `JacobianViz`'in ayrı ayrı elle yazdığı "teknik detayı sonradan göster"
 * deseninin tek yerde toplanmış hali (bkz. docs/16-urun-denetimi.md madde
 * 4 — "Basit Açıklama"dan "Teknik Detay"a kademeli açılım — ve madde 55
 * "debug mode"). Native `<details>/<summary>` kullanır: ek JS state'i,
 * `aria-expanded` yönetimi gerekmez — klavye ve ekran okuyucu desteği
 * tarayıcıdan gelir (bkz. docs/02-mimari.md "Erişilebilirlik").
 *
 * Bilinçli olarak seviyeye/renk temasına bağlı değil — çağıran, kendi
 * `border`/`bg`/`ink` sınıflarını `className` ile verir; bu bileşen
 * yalnız açılıp-kapanma davranışını ve düzeni sağlar.
 */
export function NasilHesaplandi({ baslik = "Nasıl hesaplandı?", ozet, children, className = "", varsayilanAcik = false }: NasilHesaplandiProps) {
  return (
    <details key={String(varsayilanAcik)} open={varsayilanAcik} className={`group rounded-xl border p-3 ${className}`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 marker:content-none">
        <span>
          <span className="text-xs font-bold uppercase tracking-wider opacity-70">{baslik}</span>
          <span className="ml-2 text-sm">{ozet}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-xs opacity-60 transition group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-3 text-sm">{children}</div>
    </details>
  );
}
