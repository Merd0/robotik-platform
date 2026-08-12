"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import {
  createCustomRobotSpec,
  createDefaultCustomRobotDefinition,
  CUSTOM_ROBOT_MAX_DOF,
  CUSTOM_ROBOT_MAX_LINK_LENGTH,
  CUSTOM_ROBOT_MIN_DOF,
  CUSTOM_ROBOT_MIN_LINK_LENGTH,
  type CustomRobotDefinition,
  type CustomRobotValidationIssue,
} from "@/lib/robotics/customRobot";
import { forwardKinematics, type RobotSpec } from "@/lib/robotics/kinematics";
import { solveIkTarget } from "@/lib/robotics/ikSolver";
import { decodeLabState, encodeLabState, type CustomRobotLabState } from "@/lib/labState";

const STORAGE_KEY = "robotik-platform:custom-robot:v1";
const MAX_TRACE_POINTS = 160;
const DEFAULT_DEFINITION = createDefaultCustomRobotDefinition(2);

function round(value: number, digits = 3) {
  const scale = 10 ** digits;
  const result = Math.round(value * scale) / scale;
  return Object.is(result, -0) ? 0 : result;
}

function homeAngles(robot: RobotSpec): number[] {
  return robot.joints.map((joint) => {
    if (joint.limits.min <= 0 && joint.limits.max >= 0) return 0;
    return (joint.limits.min + joint.limits.max) / 2;
  });
}

function defaultTarget(robot: RobotSpec) {
  const reach = robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);
  return { x: round(reach * 0.55, 2), y: round(reach * 0.25, 2) };
}

function stateFromDefinition(definition: CustomRobotDefinition): CustomRobotLabState {
  const result = createCustomRobotSpec(definition);
  if (!result.ok) throw new Error("Varsayılan kullanıcı robotu geçersiz.");
  return {
    kind: "custom-robot",
    version: 1,
    definition: result.definition,
    jointAngles: homeAngles(result.robot),
    target: defaultTarget(result.robot),
  };
}

function tracePoint(robot: RobotSpec, angles: number[]) {
  const point = forwardKinematics(robot, angles).endEffector;
  return { x: point.x, y: point.y };
}

function PlanarRobotDiagram({
  robot,
  angles,
  target,
  trace,
}: {
  robot: RobotSpec;
  angles: number[];
  target: { x: number; y: number };
  trace: Array<{ x: number; y: number }>;
}) {
  const { jointPositions, endEffector } = useMemo(
    () => forwardKinematics(robot, angles),
    [angles, robot],
  );
  const reach = robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);
  const scale = 168 / Math.max(reach, 0.25);
  const toSvg = (point: { x: number; y: number }) => ({ x: 200 + point.x * scale, y: 200 - point.y * scale });
  const sceneJoints = jointPositions.map(toSvg);
  const sceneTarget = toSvg(target);
  const tracePath = trace.map((point, index) => {
    const scenePoint = toSvg(point);
    return `${index === 0 ? "M" : "L"} ${scenePoint.x} ${scenePoint.y}`;
  }).join(" ");
  const grid = Array.from({ length: 9 }, (_, index) => 32 + index * 42);

  return (
    <div className="relative aspect-square min-h-72 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-inner">
      <svg
        viewBox="0 0 400 400"
        className="h-full w-full"
        role="img"
        aria-label={`${robot.displayName}: ${robot.joints.length} dönel eklemli düzlemsel robot. Uç nokta x ${round(endEffector.x)} metre, y ${round(endEffector.y)} metre.`}
      >
        <rect width="400" height="400" fill="#071217" />
        <g stroke="#17343d" strokeWidth="1">
          {grid.map((value) => (
            <g key={value}>
              <line x1={value} y1="32" x2={value} y2="368" />
              <line x1="32" y1={value} x2="368" y2={value} />
            </g>
          ))}
        </g>
        <circle cx="200" cy="200" r="168" fill="none" stroke="#31535e" strokeDasharray="5 6" />
        <line x1="32" y1="200" x2="368" y2="200" stroke="#5d7881" />
        <line x1="200" y1="32" x2="200" y2="368" stroke="#5d7881" />

        {tracePath && (
          <path
            d={tracePath}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            opacity="0.72"
          />
        )}

        <g stroke="#b8d7df" strokeWidth="8" strokeLinecap="round">
          {sceneJoints.slice(0, -1).map((position, index) => (
            <line
              key={`link-${index}`}
              x1={position.x}
              y1={position.y}
              x2={sceneJoints[index + 1].x}
              y2={sceneJoints[index + 1].y}
            />
          ))}
        </g>
        <g fill="#0f172a" stroke="#5eead4" strokeWidth="3">
          {sceneJoints.map((position, index) => (
            <circle key={`joint-${index}`} cx={position.x} cy={position.y} r="7" />
          ))}
        </g>

        <g transform={`translate(${sceneTarget.x} ${sceneTarget.y})`}>
          <circle r="11" fill="none" stroke="#fb7185" strokeWidth="3" />
          <line x1="-17" y1="0" x2="17" y2="0" stroke="#fb7185" strokeWidth="2" />
          <line x1="0" y1="-17" x2="0" y2="17" stroke="#fb7185" strokeWidth="2" />
        </g>
        <text x={sceneTarget.x} y={sceneTarget.y - 22} textAnchor="middle" fill="#fecdd3" fontSize="10" fontFamily="ui-monospace, monospace">
          HEDEF
        </text>
        <text x="16" y="24" fill="#94a3b8" fontSize="10" fontFamily="ui-monospace, monospace">
          XY / metre
        </text>
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 to-transparent" />
      <p className="absolute bottom-3 left-4 font-mono text-[11px] font-semibold tracking-wide text-slate-300">
        TCP [{round(endEffector.x)}, {round(endEffector.y)}]
      </p>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  invalid,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  invalid: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-site-muted">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="min-h-11 w-full rounded-xl border border-site-border bg-site-surface px-3 font-mono text-sm text-site-ink"
      />
    </label>
  );
}

export function CustomRobotPlayground() {
  const initialState = useMemo(() => stateFromDefinition(DEFAULT_DEFINITION), []);
  const [draft, setDraft] = useState<CustomRobotDefinition>(initialState.definition);
  const [activeState, setActiveState] = useState<CustomRobotLabState>(initialState);
  const [issues, setIssues] = useState<CustomRobotValidationIssue[]>([]);
  const [trace, setTrace] = useState<Array<{ x: number; y: number }>>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);
  const [announcement, setAnnouncement] = useState("Varsayılan iki eksenli robot deneye hazır.");
  const [ikStatus, setIkStatus] = useState("IK henüz çalıştırılmadı; hedefi seçip “Hedefe çöz” düğmesini kullan.");
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const robotResult = useMemo(() => createCustomRobotSpec(activeState.definition), [activeState.definition]);
  const robot = robotResult.ok
    ? robotResult.robot
    : createCustomRobotSpec(DEFAULT_DEFINITION).ok
      ? (createCustomRobotSpec(DEFAULT_DEFINITION) as { ok: true; robot: RobotSpec }).robot
      : (() => { throw new Error("Varsayılan robot kurulamadı."); })();
  const { endEffector } = useMemo(
    () => forwardKinematics(robot, activeState.jointAngles),
    [activeState.jointAngles, robot],
  );
  const reach = robot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);

  function restoreState(state: CustomRobotLabState, source: "storage" | "share") {
    const result = createCustomRobotSpec(state.definition);
    if (!result.ok) return;
    setDraft(result.definition);
    setActiveState({ ...state, definition: result.definition });
    setIssues([]);
    setTrace([tracePoint(result.robot, state.jointAngles)]);
    setIkStatus("IK durumu yüklendi; hedefi değiştirebilir veya yeniden çözebilirsin.");
    if (source === "share") {
      setAnnouncement("Paylaşılan robot yüklendi ve bu tarayıcıya kaydedildi.");
      setShareNotice(null);
      setStorageReady(true);
    } else {
      setAnnouncement("Bu tarayıcıdaki son robot geri yüklendi.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const hasSharedState = new URLSearchParams(window.location.hash.slice(1)).has("lab");
        const encoded = window.localStorage.getItem(STORAGE_KEY);
        if (encoded && !hasSharedState) {
          const decoded = decodeLabState(encoded);
          if (decoded.ok && decoded.state.kind === "custom-robot") restoreState(decoded.state, "storage");
          else setAnnouncement("Yerel robot kaydı doğrulanamadı; güvenli varsayılan açıldı.");
        }
        setStorageAvailable(true);
        if (!hasSharedState) setStorageReady(true);
      } catch {
        setStorageAvailable(false);
        setAnnouncement("Yerel depolama kapalı; robot yalnız bu sekmede kalacak.");
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useSharedLabState(
    "custom-robot",
    (state) => restoreState(state, "share"),
    (error) => {
      setShareNotice(error);
      try {
        const encoded = window.localStorage.getItem(STORAGE_KEY);
        const decoded = encoded ? decodeLabState(encoded) : null;
        if (decoded?.ok && decoded.state.kind === "custom-robot") restoreState(decoded.state, "storage");
        else setAnnouncement("Paylaşım bağlantısı geçersiz; güvenli varsayılan açıldı.");
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
        setAnnouncement("Paylaşım açılamadı ve yerel depolama kapalı; güvenli varsayılan açıldı.");
      }
      setStorageReady(true);
    },
  );

  useEffect(() => {
    if (!storageReady) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, encodeLabState(activeState));
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeState, storageReady]);

  function updateDof(nextDof: number) {
    const defaults = createDefaultCustomRobotDefinition(nextDof).joints;
    setDraft((current) => ({
      ...current,
      joints: Array.from({ length: nextDof }, (_, index) => current.joints[index] ?? defaults[index]),
    }));
    setIssues([]);
  }

  function updateJoint(index: number, field: "linkLength" | "minDegrees" | "maxDegrees", value: number) {
    setDraft((current) => ({
      ...current,
      joints: current.joints.map((joint, jointIndex) => jointIndex === index ? { ...joint, [field]: value } : joint),
    }));
    setIssues([]);
  }

  function applyDesign() {
    const result = createCustomRobotSpec(draft);
    if (!result.ok) {
      setIssues(result.issues);
      setAnnouncement("Tasarım uygulanmadı; işaretli alanları düzelt.");
      return;
    }
    const nextState = stateFromDefinition(result.definition);
    setDraft(result.definition);
    setActiveState(nextState);
    setIssues([]);
    setTrace([tracePoint(result.robot, nextState.jointAngles)]);
    setIkStatus("IK henüz çalıştırılmadı; yeni robot için bir hedef seç.");
    setAnnouncement(storageAvailable === false
      ? "Robot uygulandı; yerel depolama kapalı olduğu için yalnız bu sekmede kalacak."
      : "Robot tarayıcıya kaydedildi.");
  }

  function setJointAngle(index: number, degrees: number) {
    const angles = activeState.jointAngles.map((angle, jointIndex) => jointIndex === index ? (degrees * Math.PI) / 180 : angle);
    setActiveState((current) => ({ ...current, jointAngles: angles }));
    setTrace((current) => [...current, tracePoint(robot, angles)].slice(-MAX_TRACE_POINTS));
    setIkStatus("FK güncellendi; turkuaz çizgi TCP izini gösteriyor.");
  }

  function setTarget(axis: "x" | "y", value: number) {
    setActiveState((current) => ({ ...current, target: { ...current.target, [axis]: value } }));
    setIkStatus("Yeni hedef seçildi; çözümü hesaplamak için “Hedefe çöz” düğmesini kullan.");
  }

  function solveTarget() {
    let solution = solveIkTarget(robot, activeState.target, "auto", "up", activeState.jointAngles);
    if (!solution.converged && robot.joints.length === 2) {
      solution = solveIkTarget(robot, activeState.target, "auto", "down", activeState.jointAngles);
    }
    if (!solution.converged || !solution.angles) {
      setIkStatus(`IK hedefe yakınsamadı · son hata ${Number.isFinite(solution.residual) ? round(solution.residual, 4) : "∞"} m. Hedefi veya eklem limitlerini değiştir.`);
      return;
    }
    setActiveState((current) => ({ ...current, jointAngles: solution.angles! }));
    setTrace((current) => [...current, tracePoint(robot, solution.angles!)].slice(-MAX_TRACE_POINTS));
    setIkStatus(`IK çözümü bulundu · ${solution.solver === "analytical" ? "analitik" : "DLS"} · ${solution.iterations} iterasyon · hata ${round(solution.residual, 5)} m.`);
  }

  function resetExperiment() {
    const next = stateFromDefinition(activeState.definition);
    setActiveState(next);
    setTrace([tracePoint(robot, next.jointAngles)]);
    setIkStatus("Deney sıfırlandı; robot güvenli başlangıç duruşunda.");
  }

  const issueFor = (field: string) => issues.some((issue) => issue.field === field || (issue.field.endsWith(".limits") && field.startsWith(issue.field.slice(0, -"limits".length))));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14" aria-label="Özel robot tasarım alanı">
      {shareNotice && (
        <div role="alert" className="mb-6 rounded-xl border border-danger-border bg-danger-surface p-4 text-sm font-semibold text-danger-ink">
          {shareNotice}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(20rem,0.78fr)_minmax(0,1.42fr)]">
        <form
          className="lab-panel p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            applyDesign();
          }}
          noValidate
        >
          <div className="border-b border-site-border pb-5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-site-accent-text">RobotSpec oluşturucu</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-site-ink">Geometriyi tanımla</h2>
            <p className="mt-2 text-sm leading-6 text-site-muted">Düzlemsel seri kol · DH a parametresi · radyana çevrilen derece limitleri</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <label className="grid gap-1.5 text-sm font-semibold text-site-ink">
              <span>Robot etiketi <span className="font-normal text-site-muted">(isteğe bağlı)</span></span>
              <input
                value={draft.name}
                maxLength={48}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, name: event.target.value }));
                  setIssues([]);
                }}
                className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-site-ink"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-site-ink">
              <span>Eklem sayısı</span>
              <select
                value={draft.joints.length}
                onChange={(event) => updateDof(Number(event.target.value))}
                className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 font-mono text-site-ink"
              >
                {Array.from({ length: CUSTOM_ROBOT_MAX_DOF - CUSTOM_ROBOT_MIN_DOF + 1 }, (_, index) => index + CUSTOM_ROBOT_MIN_DOF).map((dof) => (
                  <option key={dof} value={dof}>{dof} DOF</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="mt-6 grid gap-4">
            <legend className="mb-1 text-sm font-bold text-site-ink">Eklem ve bağlantı parametreleri</legend>
            {draft.joints.map((joint, index) => (
              <div key={index} className="rounded-2xl border border-site-border bg-site-soft p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-heading text-xl font-bold text-site-ink">J{index + 1}</h3>
                  <span className="rounded-full border border-site-border bg-site-surface px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-site-muted">DH · a{index + 1}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-site-muted sm:col-span-2">
                    <span>J{index + 1} eklem tipi</span>
                    <select value={joint.type} onChange={() => undefined} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-sm text-site-ink">
                      <option value="revolute">Dönel · revolute</option>
                    </select>
                  </label>
                  <NumberField
                    label={`J${index + 1} bağlantı uzunluğu`}
                    value={joint.linkLength}
                    min={CUSTOM_ROBOT_MIN_LINK_LENGTH}
                    max={CUSTOM_ROBOT_MAX_LINK_LENGTH}
                    step={0.05}
                    invalid={issueFor(`joints.${index}.linkLength`)}
                    onChange={(value) => updateJoint(index, "linkLength", value)}
                  />
                  <div className="hidden sm:block" aria-hidden="true">
                    <p className="mb-1.5 text-xs font-semibold text-site-muted">Birim</p>
                    <div className="grid min-h-11 place-items-center rounded-xl border border-dashed border-site-border bg-site-surface font-mono text-xs font-semibold text-site-muted">metre</div>
                  </div>
                  <NumberField
                    label={`J${index + 1} en küçük açı`}
                    value={joint.minDegrees}
                    min={-180}
                    max={180}
                    step={1}
                    invalid={issueFor(`joints.${index}.minDegrees`)}
                    onChange={(value) => updateJoint(index, "minDegrees", value)}
                  />
                  <NumberField
                    label={`J${index + 1} en büyük açı`}
                    value={joint.maxDegrees}
                    min={-180}
                    max={180}
                    step={1}
                    invalid={issueFor(`joints.${index}.maxDegrees`)}
                    onChange={(value) => updateJoint(index, "maxDegrees", value)}
                  />
                </div>
              </div>
            ))}
          </fieldset>

          {issues.length > 0 && (
            <div role="alert" className="mt-5 rounded-xl border border-danger-border bg-danger-surface p-4 text-sm text-danger-ink">
              <p className="font-bold">Robot uygulanamadı</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {issues.map((issue, index) => <li key={`${issue.field}-${index}`}>{issue.message}</li>)}
              </ul>
            </div>
          )}

          <button type="submit" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-site-strong px-5 py-3 text-sm font-bold text-site-on-strong hover:opacity-90">
            Tasarımı uygula
          </button>
          <p role="status" aria-live="polite" className="mt-3 text-xs leading-5 text-site-muted">{announcement}</p>
          <p className="mt-1 text-[11px] leading-5 text-site-subtle">
            {storageAvailable === false ? "Kalıcı kayıt kullanılamıyor." : "Kayıt yalnız bu tarayıcıdaki localStorage alanında tutulur; sunucuya gönderilmez."}
          </p>
        </form>

        <section aria-label="Robot deneyi" className="lab-panel overflow-hidden p-4 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-site-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-site-accent-text">FK / IK / TCP izi</p>
              <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-site-ink">{robot.displayName}</h2>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-site-border bg-site-border text-center font-mono text-[10px] uppercase tracking-wider text-site-muted">
              <div className="bg-site-surface px-3 py-2"><strong className="block text-sm text-site-ink">{robot.joints.length}</strong>DOF</div>
              <div className="bg-site-surface px-3 py-2"><strong className="block text-sm text-site-ink">{round(reach, 2)} m</strong>erişim</div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]">
            <div>
              <PlanarRobotDiagram robot={robot} angles={activeState.jointAngles} target={activeState.target} trace={trace} />
              <p className="sr-only">
                Robotun uç noktası x {round(endEffector.x)} metre, y {round(endEffector.y)} metre. Hedef x {round(activeState.target.x)} metre, y {round(activeState.target.y)} metre.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs text-site-muted">
                <p className="rounded-xl border border-site-border bg-site-soft p-3"><span className="block text-[10px] uppercase tracking-wider">TCP · x</span><strong className="mt-1 block text-site-ink">{round(endEffector.x)} m</strong></p>
                <p className="rounded-xl border border-site-border bg-site-soft p-3"><span className="block text-[10px] uppercase tracking-wider">TCP · y</span><strong className="mt-1 block text-site-ink">{round(endEffector.y)} m</strong></p>
              </div>
            </div>

            <div className="grid content-start gap-5">
              <fieldset className="grid gap-3">
                <legend className="mb-1 text-sm font-bold text-site-ink">İleri kinematik</legend>
                {robot.joints.map((joint, index) => {
                  const degrees = round((activeState.jointAngles[index] * 180) / Math.PI, 1);
                  return (
                    <label key={index} className="grid gap-1 text-xs font-semibold text-site-muted">
                      <span className="flex justify-between gap-3"><span>J{index + 1} açısı</span><output className="font-mono text-site-ink">{degrees}°</output></span>
                      <input
                        type="range"
                        aria-label={`J${index + 1} açısı`}
                        value={degrees}
                        min={round((joint.limits.min * 180) / Math.PI, 6)}
                        max={round((joint.limits.max * 180) / Math.PI, 6)}
                        step={1}
                        onChange={(event) => setJointAngle(index, Number(event.target.value))}
                        className="min-h-11 w-full accent-teal-600"
                      />
                    </label>
                  );
                })}
              </fieldset>

              <fieldset className="grid gap-3 border-t border-site-border pt-5">
                <legend className="mb-1 text-sm font-bold text-site-ink">Ters kinematik hedefi</legend>
                {(["x", "y"] as const).map((axis) => (
                  <label key={axis} className="grid gap-1 text-xs font-semibold text-site-muted">
                    <span className="flex justify-between gap-3"><span>Hedef {axis.toUpperCase()}</span><output className="font-mono text-site-ink">{round(activeState.target[axis], 2)} m</output></span>
                    <input
                      type="range"
                      aria-label={`Hedef ${axis.toUpperCase()}`}
                      value={activeState.target[axis]}
                      min={round(-reach, 2)}
                      max={round(reach, 2)}
                      step={0.01}
                      onChange={(event) => setTarget(axis, Number(event.target.value))}
                      className="min-h-11 w-full accent-rose-500"
                    />
                  </label>
                ))}
                <button type="button" onClick={solveTarget} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800">
                  Hedefe çöz
                </button>
                <p role="status" aria-live="polite" className="min-h-10 rounded-xl border border-site-border bg-site-soft p-3 text-xs leading-5 text-site-muted">{ikStatus}</p>
              </fieldset>

              <div className="grid grid-cols-2 gap-3 border-t border-site-border pt-5">
                <button type="button" onClick={() => setTrace([tracePoint(robot, activeState.jointAngles)])} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-xs font-bold text-site-ink hover:bg-site-soft">İzi temizle</button>
                <button type="button" onClick={resetExperiment} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-xs font-bold text-site-ink hover:bg-site-soft">Deneyi sıfırla</button>
              </div>
            </div>
          </div>

          <ExperimentShareButton
            seviye="universite"
            createShareUrl={() => createLabShareUrl(activeState)}
            buttonLabel="Bu robotu paylaş"
            linkLabel="Paylaşılan robotu aç"
            idleDescription="Bağlantı son uygulanan geçerli RobotSpec'i, eklem duruşunu ve IK hedefini taşır; hesap gerektirmez."
          />
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["01 / Sınır", "1–6 DOF", "Bu aralık mobil kontrolleri okunur tutar ve mevcut tarayıcı motorunun doğrulanmış üst sınırıyla eşleşir."],
          ["02 / Model", "Revolute v1", "Her eklemde α, d ve θ ofseti sıfır; kullanıcı DH a uzunluğunu ve mekanik açı aralığını belirler."],
          ["03 / Gizlilik", "Yerel + URL", "Robot yerel depoda kalır. Paylaşım verisi URL fragment'ındadır; sunucuya, hesaba veya izleyiciye gitmez."],
        ].map(([eyebrow, title, body]) => (
          <article key={eyebrow} className="rounded-2xl border border-site-border bg-site-surface p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-site-accent-text">{eyebrow}</p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-site-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-site-muted">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
