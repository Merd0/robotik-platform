"use client";

import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import {
  ChallengeHeader,
  ChallengeResult,
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import {
  forwardKinematics,
  type Elbow,
} from "@/lib/robotics/kinematics";
import { resolveIkSolver, solveIkTarget, type IkSolverMode, type IkTargetSolution } from "@/lib/robotics/ikSolver";
import { getRobotById } from "@/lib/robotics/robots";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import { useTheme } from "@/components/ui/ThemeProvider";
import { SCENE_PALETTES } from "@/lib/theme";
import { Neden } from "@/components/interactive/Neden";
import { RobotInfoLine } from "@/components/interactive/RobotInfoLine";

interface IkTargetProps {
  robot: string;
  solver?: IkSolverMode;
  pilot?: "geometric-ik";
}

const round = (value: number) => Math.round(value * 1000) / 1000;
const toDegrees = (value: number) => round((value * 180) / Math.PI);

/** Ders içine gömülen etkileşimli sahne: hedefi sürükle, robot ters kinematikle uzansın. */
export function IkTarget({ robot: robotId, solver = "auto", pilot }: IkTargetProps) {
  const record = useEvidenceRecorder();
  const { theme } = useTheme();
  const palette = SCENE_PALETTES[theme];
  const robot = useMemo(() => getRobotById(robotId), [robotId]);
  const maxReach = useMemo(
    () => robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0),
    [robot],
  );
  const initialTarget = useMemo(() => ({ x: maxReach * 0.6, y: maxReach * 0.35 }), [maxReach]);
  const resolvedSolver = resolveIkSolver(robot, solver);
  const initialSolution = useMemo(
    () => solveIkTarget(robot, initialTarget, solver, "up", robot.joints.map(() => 0.1)),
    [initialTarget, robot, solver],
  );

  const [target, setTarget] = useState(initialTarget);
  const [elbow, setElbow] = useState<Elbow>("up");
  const [angles, setAngles] = useState<number[]>(() => initialSolution.angles ?? robot.joints.map(() => 0));
  const [solution, setSolution] = useState<IkTargetSolution>(initialSolution);
  const [reachable, setReachable] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeSamples, setChallengeSamples] = useState<Partial<Record<"reachable" | "unreachable", { x: number; y: number }>>>({});
  const challengeAvailable = pilot === "geometric-ik" && robot.id === "generic-2dof";
  const challengeComplete = Boolean(challengeSamples.reachable && challengeSamples.unreachable);
  useSharedLabState("ik-target", (state) => {
    if (state.robotId !== robot.id) return;
    const restored = solveIkTarget(robot, state.target, state.solver, state.elbow, angles);
    setTarget(state.target);
    setElbow(state.elbow);
    setSolution(restored);
    if (restored.angles) setAngles(restored.angles);
    setReachable(Boolean(restored.angles));
    setChallengeActive(false);
    setChallengeSamples({});
  });

  // Görsel güncelleme: sürükleme/kaydırma sırasında her karede çağrılabilir,
  // kesintisiz kalır. Kanıt YAZMAZ — bkz. commitTarget.
  function applyTarget(point: { x: number; y: number }, elbowChoice: Elbow): IkTargetSolution {
    setTarget(point);
    const nextSolution = solveIkTarget(robot, point, solver, elbowChoice, angles);
    setSolution(nextSolution);
    if (nextSolution.angles) {
      setAngles(nextSolution.angles);
      setReachable(true);
    } else {
      setReachable(false);
    }
    return nextSolution;
  }

  /**
   * Kalıcı kanıt yalnız semantik commit anında yazılır (pointer-up / blur /
   * klavye commit) — JointSliders'daki aynı desen (Sprint 0, localStorage
   * aşınması düzeltmesi). `applyTarget`'ın DÖNÜŞ DEĞERİNİ kullanır, React
   * state'ini değil: aksi halde aynı senkron çağrıda henüz commit edilmemiş
   * (bayat) bir değeri kaydetmiş olurduk.
   */
  function commitTarget(point: { x: number; y: number }, elbowChoice: Elbow) {
    const solutionNow = applyTarget(point, elbowChoice);
    if (solutionNow.angles) {
      record({ skillId: "inverse-kinematics", stage: "tried", result: "success", metrics: { x: round(point.x), y: round(point.y), elbow: elbowChoice, solver: solutionNow.solver, iterations: solutionNow.iterations, residual: round(solutionNow.residual) } });
      if (challengeActive) setChallengeSamples((current) => ({ ...current, reachable: point }));
    } else {
      record({ skillId: "inverse-kinematics", stage: "observed", result: "retry", metrics: { unreachable: true } });
      if (challengeActive) setChallengeSamples((current) => ({ ...current, unreachable: point }));
    }
  }

  function handleElbowToggle() {
    const next = elbow === "up" ? "down" : "up";
    setElbow(next);
    // Düzeltme (Sprint 2): eskiden dirsek değişimi ÇÖZÜMSÜZ bir konuma
    // düşse bile koşulsuz "success" kaydediyordu — multiple-ik-solutions
    // predicate'i bu yüzden yanlışlıkla geçilebiliyordu. Artık gerçek
    // çözülebilirliğe bakıyor.
    const solutionNow = applyTarget(target, next);
    record({
      skillId: "multiple-ik-solutions",
      stage: "observed",
      result: solutionNow.angles ? "success" : "retry",
      metrics: solutionNow.angles ? { elbow: next } : { elbow: next, unreachable: true },
    });
  }

  function resetChallenge() {
    setElbow("up");
    setChallengeSamples({});
    applyTarget(initialTarget, "up");
  }

  function handleReset() {
    resetChallenge();
  }

  function toggleChallenge() {
    const next = !challengeActive;
    setChallengeActive(next);
    setChallengeSamples({});
    setElbow("up");
    applyTarget(initialTarget, "up");
  }

  const { endEffector } = useMemo(() => forwardKinematics(robot, angles), [robot, angles]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-lise-ink/10 bg-lise-surface p-4">
      {challengeAvailable && (
        <ChallengeHeader
          seviye="lise"
          active={challengeActive}
          eyebrow="Keşif görevi"
          title="Çalışma uzayı sınırını iki ölçümle bul"
          description="Aynı kol için önce çözülebilen, sonra gerçek açılı çözümü olmayan bir hedef seç. İki ölçüm birlikte sınırı gösterir."
          constraints={[
            "Kolun ulaşabildiği bir hedef konumu kaydet.",
            "Hedefi çalışma uzayının dışına taşı ve çözümsüz konumu kaydet.",
          ]}
          onToggle={toggleChallenge}
        />
      )}

      <SahneAlani className="aspect-square w-full overflow-hidden rounded-lg bg-lise-bg sm:aspect-video">
        <RobotArm robot={robot} jointAngles={angles}>
          <mesh
            position={[target.x, target.y, 0.02]}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              setDragging(true);
            }}
          >
            <sphereGeometry args={[0.09, 24, 24]} />
            <meshStandardMaterial color={reachable ? palette.reachable : palette.unreachable} />
          </mesh>
          {dragging && (
            <mesh
              onPointerMove={(event: ThreeEvent<PointerEvent>) =>
                applyTarget({ x: event.point.x, y: event.point.y }, elbow)
              }
              onPointerUp={() => {
                setDragging(false);
                commitTarget(target, elbow);
              }}
              onPointerLeave={() => setDragging(false)}
            >
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </RobotArm>
      </SahneAlani>
      <RobotInfoLine robot={robot} className="text-lise-ink/70" />

      {/*
        Hedefi sürüklemek dokunmatik/fare için doğal ama klavyeyle imkânsız.
        docs/02 "her etkileşimli sahnenin klavyeyle kullanılabilir bir
        alternatifi olmalı" kuralı gereği aynı hedef bu iki kaydırıcıyla da
        konumlandırılabiliyor — alttaki IK çözümü ikisinde de aynı.
      */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["x", "y"] as const).map((eksen) => (
          <label key={eksen} className="flex flex-col gap-1 text-sm">
            <span>
              Hedef {eksen.toUpperCase()}: {round(target[eksen])} m
            </span>
            <input
              type="range"
              className="h-11 touch-pan-y accent-lise-accent"
              min={-maxReach}
              max={maxReach}
              step={0.01}
              value={target[eksen]}
              onChange={(event) =>
                applyTarget({ ...target, [eksen]: Number(event.target.value) }, elbow)
              }
              onPointerUp={() => commitTarget(target, elbow)}
              onBlur={() => commitTarget(target, elbow)}
              onKeyUp={() => commitTarget(target, elbow)}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span role="status">
          {reachable
            ? `Hedef: (${round(target.x)}, ${round(target.y)})`
            : "Bu noktaya ulaşılamıyor — hedef, erişim alanının dışında"}
        </span>
        <div className="flex gap-2">
          {resolvedSolver === "analytical" && robot.joints.length === 2 && (
            <button
              type="button"
              onClick={handleElbowToggle}
              className="h-11 rounded-md border border-lise-ink/20 px-4"
            >
              Dirsek: {elbow === "up" ? "yukarı" : "aşağı"}
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="h-11 rounded-md bg-lise-ink px-4 text-lise-surface"
          >
            Sıfırla
          </button>
        </div>
      </div>
      <p className="text-xs text-lise-ink/70">
        Uç nokta: ({round(endEffector.x)}, {round(endEffector.y)}) · Çözücü: {solution.solver === "dls" ? "DLS sayısal" : "analitik"} · {solution.iterations} iterasyon · hata {Number.isFinite(solution.residual) ? round(solution.residual) : "—"} m
      </p>

      {reachable && (
        <p className="text-xs text-lise-ink/70">
          Eklem açıları: {angles.map((angle, index) => `θ${index + 1}=${toDegrees(angle)}°`).join(" · ")}{" "}
          <Neden etiket="Neden bu açılar?">
            {solution.solver === "analytical" && robot.joints.length === 2 ? (
              <>
                Bu robotta iki bağlantı var: a1 = {round(robot.joints[0].dhParams.a)} m, a2 ={" "}
                {round(robot.joints[1].dhParams.a)} m. Hedefin merkeze uzaklığının karesi r² = x² + y² ={" "}
                {round(target.x * target.x + target.y * target.y)}. Kosinüs teoremiyle θ2 için iki çözüm
                var (dirsek yukarı/aşağı); şu an dirsek &ldquo;{elbow === "up" ? "yukarı" : "aşağı"}&rdquo;{" "}
                seçili olduğu için θ2 = {toDegrees(angles[1])}° bulundu, θ1 = {toDegrees(angles[0])}° bu
                değerden geometriyle çıktı. Kaynak kodu:{" "}
                <code>lib/robotics/kinematics.ts</code> içindeki{" "}
                <code>inverseKinematicsAnalytical2Dof</code>.
              </>
            ) : (
              <>
                Bu robotta kapalı-form (analitik) formül yok; sayısal çözücü {solution.iterations} iterasyonda
                hedefe {Number.isFinite(solution.residual) ? round(solution.residual) : "—"} m hatayla
                yakınsadı.
              </>
            )}
          </Neden>
        </p>
      )}

      {challengeActive && !challengeComplete && (
        <p className="rounded-lg border border-lise-ink/10 bg-lise-bg p-3 text-sm text-lise-ink" role="status">
          Ölçüm kaydı · ulaşılabilir {challengeSamples.reachable ? "✓" : "○"} · erişim dışı {challengeSamples.unreachable ? "✓" : "○"}
        </p>
      )}

      {challengeActive && challengeComplete && challengeSamples.reachable && challengeSamples.unreachable && (
        <ChallengeResult
          seviye="lise"
          title="Çalışma uzayı sınırı gözlendi"
          summary="Aynı bağlantı uzunluklarıyla bir hedefin çözülebildiğini, diğerinin ise gerçek eklem açıları üretmediğini karşılaştırdın."
          metrics={[
            { label: "Ulaşılabilir", value: `(${round(challengeSamples.reachable.x)}, ${round(challengeSamples.reachable.y)}) m` },
            { label: "Erişim dışı", value: `(${round(challengeSamples.unreachable.x)}, ${round(challengeSamples.unreachable.y)}) m` },
            { label: "Azami erişim", value: `${round(maxReach)} m` },
          ]}
          onRetry={resetChallenge}
        />
      )}

      {challengeActive && challengeComplete && !reachable && challengeSamples.reachable && (
        <button
          type="button"
          onClick={() => applyTarget(challengeSamples.reachable!, elbow)}
          className="min-h-11 self-start rounded-xl border border-lise-ink/20 px-4 text-sm font-semibold text-lise-ink"
        >
          Ulaşılabilir örneği sahneye geri yükle
        </button>
      )}

      {challengeAvailable && (
        <ExperimentShareButton
          seviye="lise"
          createShareUrl={() => createLabShareUrl({
            kind: "ik-target",
            version: 1,
            robotId: robot.id,
            target,
            elbow,
            solver,
          })}
          disabled={!reachable}
          disabledReason="Erişim dışındaki hedef doğrulanabilir paylaşım durumuna girmiyor; paylaşmak için hedefi yeniden erişim alanına taşı."
        />
      )}
    </div>
  );
}
