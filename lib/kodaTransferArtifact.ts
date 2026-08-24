import { canonicalize, digest } from "./lessonArtifact";
import { KODA_TRANSFER_SENARYOLARI } from "./kodaTransferGate";

/** "Satırdan poza" geçiş kapısının içerik sürüm kökü — bkz. lib/esnekHucreArtifact.ts'teki aynı gerekçe. */
export function computeKodaTransferContentVersion(): string {
  return digest(
    JSON.stringify(
      canonicalize({
        schema: "koda-transfer-gate/v1",
        senaryolar: KODA_TRANSFER_SENARYOLARI,
      }),
    ),
  );
}
