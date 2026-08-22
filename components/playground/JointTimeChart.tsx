import type { JointTimeSample } from "@/lib/robotics/customRobotMotion";

interface JointTimeChartProps {
  samples: readonly JointTimeSample[];
  className?: string;
}

const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 100;
const PADDING = 6;

/**
 * docs/16-urun-denetimi.md madde 27 — eklem açısı/zaman grafiği. Yalnız
 * `sampleTrajectoryOverTime`'ın (lib/robotics/customRobotMotion.ts) ürettiği,
 * zaten hesaplanmış kübik profil örneklerini çiziyor; burada yeni bir
 * matematik yok, dekoratif de değil — her nokta gerçek bir `sampleJointTrajectory`
 * çağrısının sonucu (bkz. madde 52 "gerçekte hesaplamadığımızı hesaplıyormuş
 * gibi göstermeyelim").
 *
 * 6 renge kadar sabit bir palet kullanır (kullanıcı robotu 1-6 eklemli
 * olabilir, bkz. lib/robotics/customRobot.ts). Renk tek başına bilgi
 * taşımıyor — her çizginin altında metin etiketli bir lejant var (docs/02
 * "renk tek başına anlam taşımasın").
 */
const JOINT_COLORS = ["#0f766e", "#c2410c", "#7c3aed", "#0369a1", "#b91c1c", "#65a30d"] as const;

const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export function JointTimeChart({ samples, className = "" }: JointTimeChartProps) {
  if (samples.length < 2) return null;
  const jointCount = samples[0].angles.length;
  const totalSeconds = samples[samples.length - 1].tSeconds;

  const degreeSamples = samples.map((sample) => sample.angles.map(toDegrees));
  const allDegrees = degreeSamples.flat();
  const minDeg = Math.min(...allDegrees);
  const maxDeg = Math.max(...allDegrees);
  // Sabit bir açıklığa (>=1°) böl — düz bir çizgide (sıfır menzil) bölme hatası olmasın.
  const span = Math.max(1, maxDeg - minDeg);

  const usableWidth = VIEW_WIDTH - PADDING * 2;
  const usableHeight = VIEW_HEIGHT - PADDING * 2;
  const xFor = (tSeconds: number) => PADDING + (totalSeconds <= 0 ? 0 : (tSeconds / totalSeconds) * usableWidth);
  const yFor = (deg: number) => PADDING + usableHeight - ((deg - minDeg) / span) * usableHeight;

  const polylines = Array.from({ length: jointCount }, (_, jointIndex) =>
    samples.map((sample, sampleIndex) => `${xFor(sample.tSeconds)},${yFor(degreeSamples[sampleIndex][jointIndex])}`).join(" "),
  );

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Eklem açısı / zaman grafiği: ${jointCount} eklem, ${totalSeconds.toFixed(2)} saniyelik hareket, açı aralığı ${round1(minDeg)}° ile ${round1(maxDeg)}° arası.`}
      >
        <line x1={PADDING} y1={VIEW_HEIGHT - PADDING} x2={VIEW_WIDTH - PADDING} y2={VIEW_HEIGHT - PADDING} stroke="currentColor" opacity=".2" />
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={VIEW_HEIGHT - PADDING} stroke="currentColor" opacity=".2" />
        {polylines.map((points, jointIndex) => (
          <polyline key={jointIndex} points={points} fill="none" stroke={JOINT_COLORS[jointIndex % JOINT_COLORS.length]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
        {Array.from({ length: jointCount }, (_, jointIndex) => (
          <span key={jointIndex} className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="inline-block size-2 rounded-full" style={{ backgroundColor: JOINT_COLORS[jointIndex % JOINT_COLORS.length] }} />
            θ{jointIndex + 1}
          </span>
        ))}
        <span className="opacity-70">0 – {totalSeconds.toFixed(2)} s</span>
      </div>
    </div>
  );
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
