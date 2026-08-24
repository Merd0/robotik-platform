import { canonicalize, digest } from "./lessonArtifact";
import { ESNEK_HUCRE_SENARYOLARI } from "./esnekHucre";

/**
 * "Esnek Hücreyi Devreye Al" kapanış projesinin TEK içerik sürüm kökü.
 * Kod Akademisi modüllerindeki `computeModuleHash` ile aynı felsefe
 * (bkz. lib/kodAkademisiArtifact.ts) ama bu sayfa `content-kod-akademisi/`
 * MDX kataloğundan geçmiyor — anlatı `app/kod-akademisi/kapanis/page.tsx`
 * içinde sabit metin, çünkü tek seferlik bir proje sayfası, tekrarlanan bir
 * modül şablonu değil. Sürüm kökü senaryo fixture'larına bağlı: bir senaryo
 * (iş emri, beklenen sonuç, sensör onayı) değişirse öğrencinin eski kanıtı
 * otomatik eskir.
 */
export function computeEsnekHucreContentVersion(): string {
  return digest(
    JSON.stringify(
      canonicalize({
        schema: "esnek-hucre-capstone/v1",
        senaryolar: ESNEK_HUCRE_SENARYOLARI,
      }),
    ),
  );
}
