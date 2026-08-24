import { canonicalize, digest } from "./lessonArtifact";
import { KODA_PARAMETRE_SENARYOLARI } from "./kodaParametreTransfer";

/** "Aynı komutu farklı hedefe genelle" içerik sürüm kökü — bkz. lib/esnekHucreArtifact.ts'teki aynı gerekçe. */
export function computeKodaParametreContentVersion(): string {
  return digest(
    JSON.stringify(
      canonicalize({
        schema: "koda-parametre-transfer/v1",
        senaryolar: KODA_PARAMETRE_SENARYOLARI,
      }),
    ),
  );
}
