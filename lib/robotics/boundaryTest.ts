import type { Elbow, RobotSpec } from "./kinematics";
import {
  analyzePlanarReachability,
  supportsPlanarReachability,
  type PlanarReachabilityAnalysis,
} from "./reachability";

/**
 * "Sınır Testi" laboratuvarının saf motoru (docs/16 FAZ 5). Yeni bir
 * çarpışma/erişilebilirlik hesabı İCAT ETMEZ — `lib/robotics/
 * reachability.ts`teki gerçek analitik sınıflandırıcıyı, robotun kendi
 * geometrisinden (a1, a2) türetilen sabit hedef noktalarında çağırır.
 * Oyun ikili bir tahmin: "ulaşılabilir mi?" — doğru cevap her zaman
 * `analyzePlanarReachability`in o an gerçekten hesapladığı sonuçtur,
 * önceden yazılmış bir cevap YOKTUR.
 */

export interface BoundaryTestRound {
  id: string;
  label: string;
  target: { x: number; y: number };
  elbow: Elbow;
}

export interface BoundaryTestOutcome {
  correct: boolean;
  analysis: PlanarReachabilityAnalysis;
}

/** Tüm round'lar aynı sabit yönde, yalnız mesafe değişir — yön oyunun konusu değil. */
const ROUND_ANGLE = Math.PI / 5;

function pointAtDistance(distance: number, angle: number): { x: number; y: number } {
  return { x: distance * Math.cos(angle), y: distance * Math.sin(angle) };
}

/** İç boşluk (min erişim) bu değerden büyükse anlamlı sayılır; a1≈a2 olan robotlarda pratikte yok. */
const MEANINGFUL_INNER_GAP = 0.02;

export function generateBoundaryTestRounds(robot: RobotSpec): BoundaryTestRound[] {
  if (!supportsPlanarReachability(robot)) return [];

  const a1 = robot.joints[0].dhParams.a;
  const a2 = robot.joints[1].dhParams.a;
  const maxReach = a1 + a2;
  const minReach = Math.abs(a1 - a2);

  const rounds: BoundaryTestRound[] = [
    {
      id: "orta",
      label: "Çalışma uzayının tam ortasında bir nokta",
      target: pointAtDistance(maxReach * 0.5, ROUND_ANGLE),
      elbow: "up",
    },
    {
      id: "cok-uzak",
      label: "Azami erişimin epey ötesinde bir nokta",
      target: pointAtDistance(maxReach * 1.3, ROUND_ANGLE),
      elbow: "up",
    },
    {
      id: "tam-kenar",
      label: "Kolun neredeyse tam düz açıldığı, kenara çok yakın bir nokta",
      target: pointAtDistance(maxReach * 0.98, ROUND_ANGLE),
      elbow: "up",
    },
  ];

  if (minReach > MEANINGFUL_INNER_GAP) {
    rounds.push(
      {
        id: "ic-bosluk",
        label: "Kolun katlanınca bile ulaşamadığı iç boşlukta bir nokta",
        target: pointAtDistance(minReach * 0.5, ROUND_ANGLE),
        elbow: "up",
      },
      {
        id: "ic-bosluk-kenari",
        label: "İç boşluğun hemen dışında, kolun neredeyse tam katlandığı bir nokta",
        target: pointAtDistance(minReach * 1.05, ROUND_ANGLE),
        elbow: "up",
      },
    );
  }

  return rounds;
}

export function evaluateBoundaryTestGuess(
  robot: RobotSpec,
  round: BoundaryTestRound,
  guessReachable: boolean,
): BoundaryTestOutcome {
  const analysis = analyzePlanarReachability(robot, round.target, round.elbow);
  const actuallyReachable = analysis.angles !== null;
  return { correct: guessReachable === actuallyReachable, analysis };
}
