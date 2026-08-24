import { canonicalize, digest } from "./lessonArtifact";
import { KODA_FRAME_CHAIN_SENARYOLARI } from "./kodaFrameChain";

/** "Çerçeve zincirini birleştir" içerik sürüm kökü — bkz. lib/esnekHucreArtifact.ts'teki aynı gerekçe. */
export function computeKodaFrameChainContentVersion(): string {
  return digest(
    JSON.stringify(
      canonicalize({
        schema: "koda-frame-chain/v1",
        senaryolar: KODA_FRAME_CHAIN_SENARYOLARI,
      }),
    ),
  );
}
