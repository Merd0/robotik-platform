"use client";

import type { ReactNode } from "react";
import { InlineNot } from "@/components/interactive/InlineNot";

interface NedenProps {
  /** O anki DURUMA bağlı açıklama (ör. gerçek hedef/eklem sayılarıyla doldurulmuş formül). */
  children: ReactNode;
  /** Ekran okuyucu ve odak sırası için bağlama özgü etiket (ör. "Joint 2 açısının nedeni"). */
  etiket?: string;
}

/**
 * docs/16-urun-denetimi.md madde 33 — Mert'in "J3: 142° / Why? / ..."
 * örneği: bir SAYININ yanında, O SAYININ o anki durumda neden o değeri
 * aldığını açıklayan küçük bir tetikleyici.
 *
 * `NasilHesaplandi`den (Faz 2) FARKI bilinçli: NasilHesaplandi durağan bir
 * MEKANİZMA açıklamasıdır (formül her zaman aynı metni gösterir).
 * `Neden`, ekrandaki O ANKİ SAYIYA bağlı, DURUMA GÖRE DEĞİŞEN bir
 * açıklamadır — çağıran taraf `children`e o anki gerçek sayıları
 * (hedef koordinatı, hesaplanan ara değer, seçilen dal) basar. Bu yüzden
 * `Neden` veri almaz, yalnız zaten hesaplanmış açıklamayı ÇERÇEVELER —
 * matematiği tekrar üretmez, çağıranın (ör. IkTarget) zaten sahip olduğu
 * gerçek çözüm değerlerini yeniden anlatır.
 */
export function Neden({ children, etiket = "Neden?" }: NedenProps) {
  return (
    <InlineNot tetikleyici={etiket} tetikleyiciClassName="text-xs font-semibold not-italic">
      {children}
    </InlineNot>
  );
}
