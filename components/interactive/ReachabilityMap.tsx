import { useId, useMemo } from "react";
import { SINGULARITY_THRESHOLD, type Elbow, type RobotSpec } from "@/lib/robotics/kinematics";
import {
  analyzePlanarReachability,
  NEAR_LIMIT_RATIO,
  supportsPlanarReachability,
  type PlanarReachabilityAnalysis,
  type ReachabilityStatus,
} from "@/lib/robotics/reachability";

interface ReachabilityMapProps {
  robot: RobotSpec;
  target: { x: number; y: number };
  elbow: Elbow;
}

interface WorkspaceCell {
  x: number;
  y: number;
  status: ReachabilityStatus;
}

const GRID_RESOLUTION = 21;
const PLOT_SIZE = 320;
const RAD_TO_DEG = 180 / Math.PI;

const STATUS_LABELS: Record<ReachabilityStatus, string> = {
  reachable: "Ulaşılabilir",
  "near-limit": "Sınıra yakın",
  unreachable: "Ulaşılamaz",
  "singularity-risk": "Tekillik riski",
};
const STATUS_ORDER = Object.keys(STATUS_LABELS) as ReachabilityStatus[];

const STATUS_TOKENS: Record<ReachabilityStatus, { surface: string; ink: string; symbol: string }> = {
  reachable: { surface: "var(--color-success-surface)", ink: "var(--color-success-ink)", symbol: "●" },
  "near-limit": { surface: "var(--color-warning-surface)", ink: "var(--color-warning-ink)", symbol: "◐" },
  unreachable: { surface: "var(--color-danger-surface)", ink: "var(--color-danger-ink)", symbol: "×" },
  "singularity-risk": { surface: "var(--color-lise-surface)", ink: "var(--color-lise-accent-text)", symbol: "≋" },
};

const round = (value: number, digits = 2) => Number(value.toFixed(digits));
const degrees = (value: number) => round(value * RAD_TO_DEG, 1);

function describeAnalysis(analysis: PlanarReachabilityAnalysis): string {
  if (analysis.reason === "joint-limit" && analysis.blockingJoint) {
    const joint = analysis.blockingJoint;
    return `Ulaşılamaz — J${joint.jointIndex + 1} için ${degrees(joint.required)}° gerekiyor; mekanik limit ${degrees(joint.min)}° ile ${degrees(joint.max)}°.`;
  }
  if (analysis.reason === "no-real-joint-2-angle") {
    return `Ulaşılamaz — J2 için gerçek bir açı yok: cos θ2 = ${round(analysis.requiredJoint2Cosine, 3)}, geçerli aralık −1 ile 1. Hedef uzaklığı ${round(analysis.targetDistance)} m, azami erişim ${round(analysis.maximumReach)} m.`;
  }
  if (analysis.reason === "low-manipulability") {
    return `Tekillik riski — hedef çözülebilir, fakat Jacobian manipülabilite değeri ${(analysis.manipulability ?? 0).toExponential(2)}; risk eşiği ${SINGULARITY_THRESHOLD.toExponential(1)}.`;
  }
  if (analysis.reason === "joint-near-limit" && analysis.nearestLimit) {
    const joint = analysis.nearestLimit;
    return `Sınıra yakın — J${joint.jointIndex + 1} = ${degrees(joint.value)}°; mekanik aralığa kalan pay %${round(joint.marginRatio * 100, 1)}.`;
  }
  return `Ulaşılabilir — gerçek IK çözümü mekanik limitlerin içinde; en küçük limit payı %${round((analysis.minimumLimitMarginRatio ?? 0) * 100, 1)}.`;
}

function workspaceCells(robot: RobotSpec, elbow: Elbow, maximumReach: number): WorkspaceCell[] {
  return Array.from({ length: GRID_RESOLUTION * GRID_RESOLUTION }, (_, flatIndex) => {
    const column = flatIndex % GRID_RESOLUTION;
    const row = Math.floor(flatIndex / GRID_RESOLUTION);
    const x = -maximumReach + (column / (GRID_RESOLUTION - 1)) * maximumReach * 2;
    const y = maximumReach - (row / (GRID_RESOLUTION - 1)) * maximumReach * 2;
    return { x, y, status: analyzePlanarReachability(robot, { x, y }, elbow).status };
  });
}

const toPlot = (point: { x: number; y: number }, maximumReach: number) => ({
  x: ((point.x + maximumReach) / (2 * maximumReach)) * PLOT_SIZE,
  y: ((maximumReach - point.y) / (2 * maximumReach)) * PLOT_SIZE,
});

function workspacePath(
  cells: readonly WorkspaceCell[],
  status: ReachabilityStatus,
  maximumReach: number,
  cellSize: number,
): string {
  return cells
    .filter((cell) => cell.status === status)
    .map((cell) => {
      const point = toPlot(cell, maximumReach);
      const x = point.x - cellSize / 2;
      const y = point.y - cellSize / 2;
      const size = cellSize + 0.3;
      return `M${x} ${y}h${size}v${size}h-${size}Z`;
    })
    .join("");
}

/** Gerçek 2R IK/limit/Jacobian sonucunu renk + desen + metinle gösteren çalışma uzayı haritası. */
export default function ReachabilityMap({ robot, target, elbow }: ReachabilityMapProps) {
  if (!supportsPlanarReachability(robot)) return null;
  return <SupportedReachabilityMap robot={robot} target={target} elbow={elbow} />;
}

function SupportedReachabilityMap({ robot, target, elbow }: ReachabilityMapProps) {
  const patternPrefix = useId().replaceAll(":", "");
  const analysis = useMemo(
    () => analyzePlanarReachability(robot, target, elbow),
    [elbow, robot, target],
  );
  const cells = useMemo(
    () => workspaceCells(robot, elbow, analysis.maximumReach),
    [analysis.maximumReach, elbow, robot],
  );
  const cellSize = PLOT_SIZE / (GRID_RESOLUTION - 1);
  const cellPaths = useMemo(
    () => Object.fromEntries(STATUS_ORDER.map((status) => [
      status,
      workspacePath(cells, status, analysis.maximumReach, cellSize),
    ])) as Record<ReachabilityStatus, string>,
    [analysis.maximumReach, cellSize, cells],
  );
  const targetPoint = toPlot(target, analysis.maximumReach);
  const targetTokens = STATUS_TOKENS[analysis.status];

  return (
    <section className="grid gap-3 rounded-xl border border-lise-ink/10 bg-lise-bg p-3 sm:grid-cols-[minmax(0,20rem)_1fr] sm:items-center">
      <svg
        viewBox={`${-cellSize / 2} ${-cellSize / 2} ${PLOT_SIZE + cellSize} ${PLOT_SIZE + cellSize}`}
        className="aspect-square w-full rounded-lg border border-lise-ink/10 bg-lise-surface"
        role="img"
        aria-labelledby={`${patternPrefix}-title ${patternPrefix}-description`}
        data-testid="reachability-map"
      >
        <title id={`${patternPrefix}-title`}>Robot çalışma uzayı erişilebilirlik haritası</title>
        <desc id={`${patternPrefix}-description`}>
          Her hücre gerçek analitik ters kinematik, mekanik eklem limitleri ve Jacobian manipülabilitesiyle sınıflandırılır. Hedef işareti seçili noktayı gösterir.
        </desc>
        <defs>
          <pattern id={`${patternPrefix}-reachable`} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill={STATUS_TOKENS.reachable.surface} />
            <circle cx="4" cy="4" r="1.1" fill={STATUS_TOKENS.reachable.ink} opacity="0.55" />
          </pattern>
          <pattern id={`${patternPrefix}-near-limit`} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill={STATUS_TOKENS["near-limit"].surface} />
            <path d="M0 8 L8 0" stroke={STATUS_TOKENS["near-limit"].ink} strokeWidth="1.2" opacity="0.7" />
          </pattern>
          <pattern id={`${patternPrefix}-unreachable`} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill={STATUS_TOKENS.unreachable.surface} />
            <path d="M0 0 L8 8 M8 0 L0 8" stroke={STATUS_TOKENS.unreachable.ink} strokeWidth="1" opacity="0.55" />
          </pattern>
          <pattern id={`${patternPrefix}-singularity-risk`} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill={STATUS_TOKENS["singularity-risk"].surface} />
            <path d="M0 2 H8 M0 6 H8" stroke={STATUS_TOKENS["singularity-risk"].ink} strokeWidth="1.4" opacity="0.8" />
          </pattern>
        </defs>

        {STATUS_ORDER.map((status) => (
          <path
            key={status}
            d={cellPaths[status]}
            fill={`url(#${patternPrefix}-${status})`}
            data-reachability-status={status}
            aria-hidden="true"
          />
        ))}

        <path d={`M0 ${PLOT_SIZE / 2} H${PLOT_SIZE} M${PLOT_SIZE / 2} 0 V${PLOT_SIZE}`} stroke="var(--color-lise-ink)" strokeWidth="1" opacity="0.32" />
        <circle
          cx={targetPoint.x}
          cy={targetPoint.y}
          r="7"
          fill={targetTokens.ink}
          stroke="var(--color-lise-surface)"
          strokeWidth="3"
          aria-hidden="true"
        />
      </svg>

      <div className="flex min-w-0 flex-col gap-3 text-sm text-lise-ink">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-lise-accent-text">Çalışma uzayı</p>
          <p className="mt-1 font-semibold">Hedef ({round(target.x)}, {round(target.y)}) m</p>
        </div>
        <ul className="grid grid-cols-2 gap-2 text-xs" aria-label="Çalışma uzayı durumları">
          {STATUS_ORDER.map((status) => (
            <li key={status} className="flex items-center gap-2">
              <span
                className="inline-flex size-5 shrink-0 items-center justify-center rounded border text-[11px] font-black"
                style={{ background: STATUS_TOKENS[status].surface, color: STATUS_TOKENS[status].ink }}
                aria-hidden="true"
              >
                {STATUS_TOKENS[status].symbol}
              </span>
              {STATUS_LABELS[status]}
            </li>
          ))}
        </ul>
        <p
          className={`rounded-lg border px-3 py-2 font-medium ${
            analysis.status === "reachable"
              ? "border-success-border bg-success-surface text-success-ink"
              : analysis.status === "near-limit"
                ? "border-warning-border bg-warning-surface text-warning-ink"
                : "border-danger-border bg-danger-surface text-danger-ink"
          }`}
          role="status"
          aria-live="polite"
          data-testid="reachability-status"
        >
          {describeAnalysis(analysis)}
        </p>
        <p className="text-xs text-lise-ink/70">
          Sınıra yakın = mekanik aralığın son %{NEAR_LIMIT_RATIO * 100}. Tekillik riski = manipülabilite &lt; {SINGULARITY_THRESHOLD}.
        </p>
      </div>
    </section>
  );
}
