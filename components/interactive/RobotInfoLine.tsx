import type { RobotSpec } from "@/lib/robotics/kinematics";
import { formatReachMm, planarRevoluteMaxReachM } from "@/lib/robotics/robotMetadataDisplay";

/**
 * Sahnenin üstünde/altında gösterilen tek satırlık robot kimlik bilgisi.
 * Gerçek ürün metadata'sı yalnız kaynak gösterilebilir robotlarda dolu
 * (bkz. lib/robotics/kinematics.ts RobotMetadata) — jenerik robotlar için
 * marka/model UYDURULMAZ; bunun yerine bu robotun jenerik olduğu ve
 * (geçerli olduğu durumda) kendi DH uzunluklarından hesaplanan azami
 * erişim açıkça söylenir (docs/00 kaynak dürüstlüğü ilkesiyle aynı gerekçe).
 */
export function RobotInfoLine({ robot, className = "" }: { robot: RobotSpec; className?: string }) {
  const { metadata } = robot;
  const base = `text-xs leading-relaxed ${className}`.trim();

  if (metadata) {
    return (
      <p className={base} data-testid="robot-info-line" data-robot-metadata="real">
        Bu robot: <span className="font-semibold">{metadata.manufacturer} {metadata.model}</span>
        {metadata.maxReachMm !== undefined && <> · maks. erişim {formatReachMm(metadata.maxReachMm)}</>}
        {metadata.payloadKg !== undefined && <> · azami yük {metadata.payloadKg} kg</>}
        {metadata.source.url ? (
          <>
            {" · "}
            <a href={metadata.source.url} target="_blank" rel="noreferrer" className="underline">
              kaynak: {metadata.source.publisher ?? metadata.source.title}
            </a>
          </>
        ) : (
          <> · kaynak: {metadata.source.publisher ?? metadata.source.title}</>
        )}
      </p>
    );
  }

  const reachM = planarRevoluteMaxReachM(robot);
  return (
    <p className={base} data-testid="robot-info-line" data-robot-metadata="generic">
      {robot.displayName} — jenerik örnek kol, belirli bir üretici modeline karşılık gelmez.
      {reachM !== null && <> Hesaplanan azami erişim: {reachM.toFixed(2)} m (bağlantı uzunluklarının toplamı).</>}
    </p>
  );
}
