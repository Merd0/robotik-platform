import type { ReactNode } from "react";
import { getSozluk, terimSlug } from "@/lib/sozluk";
import { TerimInline } from "@/components/interactive/TerimInline";

interface TerimProps {
  /** content/sozluk.json'daki `tr` alanıyla BİREBİR eşleşmeli. */
  ad: string;
  /** Metinde görünecek ifade; verilmezse `ad` olduğu gibi gösterilir (ör. ad="Jacobian matrisi" ama gövdede sadece "Jacobian" geçiyorsa children ile kısaltılır). */
  children?: ReactNode;
}

/**
 * Ders gövdesine gömülen sözlük terimi — madde 38 (docs/16-urun-denetimi.md):
 * kullanıcı `/sozluk` sayfasına gitmek zorunda kalmadan, terimi context
 * içinde açabilsin. `content/sozluk.json`'ı SUNUCUDA (fs erişimiyle) okur —
 * bu yüzden bu bileşen "use client" DEĞİL: 72 terimlik veri hiçbir zaman
 * tarayıcıya gitmiyor, yalnız EŞLEŞEN TEK terimin tanımı `TerimInline`'a
 * (client, açılıp-kapanma state'ini tutan tek kısım) prop olarak geçiyor.
 * Bu ayrım bilinçli: tüm sözlüğü client bundle'a koymak `docs/05`teki
 * performans bütçesini (bkz. `scripts/check-performance-budget.ts` "3D'siz
 * ders" notu) gereksiz yere zorlardı.
 *
 * `ad` sözlükte karşılığı olmayan bir değerse AÇIKÇA hata fırlatır (derleme
 * zamanı çöker) — `computeInteractionHash`'in "kayıtlı olmayan bileşen"
 * davranışıyla aynı felsefe: yazım hatası sessizce kırık bir terime
 * dönüşmesin.
 */
export function Terim({ ad, children }: TerimProps) {
  const terim = getSozluk().find((entry) => entry.tr === ad);
  if (!terim) {
    throw new Error(`<Terim ad="${ad}" />: content/sozluk.json içinde bu adla bir terim yok.`);
  }

  return (
    <TerimInline tr={terim.tr} en={terim.en} tanim={terim.tanim} slug={terimSlug(terim.tr)}>
      {children ?? terim.tr}
    </TerimInline>
  );
}
