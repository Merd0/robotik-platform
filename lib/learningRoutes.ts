import type { Seviye } from "./content";

/**
 * Rota MVP'sinin tamamı bu üç sabit listeden ibaret. Bunlar otomatik bir
 * öneri motorunun çıktısı değil; her seviyede ön koşulları birbirine bağlanan
 * Temeller derslerinden elle seçilmiş güvenilir bir başlangıç sırasıdır.
 */
export const CURATED_START_ROUTES = {
  ortaokul: [
    "a-ortaokul-robot-nedir",
    "a-ortaokul-eksen-ne-demek",
    "a-ortaokul-robot-turleri",
  ],
  lise: [
    "a-lise-serbestlik-derecesi",
    "a-lise-koordinat-sistemleri",
    "a-lise-doner-dogrusal-eklemler",
  ],
  universite: [
    "a-universite-kinematik-zincir",
    "a-universite-homojen-donusum",
    "a-universite-dh-parametreleri",
  ],
} as const satisfies Record<Seviye, readonly [string, string, string]>;
