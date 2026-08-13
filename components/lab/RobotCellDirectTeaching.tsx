"use client";

import { useState } from "react";
import type { RobotCellGripAssessment, RobotCellProgramCommand, RobotCellProgramPreflight } from "@/lib/robotics/robotCellProgram";
import type { Vec3 } from "@/lib/robotics/transform";

function taskLabel(command: RobotCellProgramCommand): string {
  if (command.type === "gripper") return command.action === "close" ? "Parçayı kavra" : "Parçayı bırak";
  return command.pose.label;
}

function formatCoordinate(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RobotCellDirectTeaching({
  commands,
  preflight,
  grip,
  gripperClosed,
  holdingPart,
  directStatus,
  tcp,
  activeTarget,
  taskFinished,
  playing,
  programName,
  storageStatus,
  selectedCommandId,
  onGrip,
  onRelease,
  onProgramNameChange,
  onSavePose,
  onJog,
  onSelectCommand,
  onMoveCommand,
  onOverwriteSelected,
  onRemoveCommand,
  onRepair,
  onReset,
  onClear,
}: {
  commands: readonly RobotCellProgramCommand[];
  preflight: RobotCellProgramPreflight;
  grip: RobotCellGripAssessment;
  gripperClosed: boolean;
  holdingPart: boolean;
  directStatus: string;
  tcp: Vec3;
  activeTarget: Vec3;
  taskFinished: boolean;
  playing: boolean;
  programName: string;
  storageStatus: string;
  selectedCommandId: string | null;
  onGrip: () => void;
  onRelease: () => void;
  onProgramNameChange: (name: string) => void;
  onSavePose: () => void;
  onJog: (axis: "x" | "y" | "z", delta: number) => void;
  onSelectCommand: (id: string) => void;
  onMoveCommand: (id: string, direction: -1 | 1) => void;
  onOverwriteSelected: () => void;
  onRemoveCommand: (id: string) => void;
  onRepair: () => void;
  onReset: () => void;
  onClear: () => void;
}) {
  const [stepMetres, setStepMetres] = useState(0.05);
  const targetDistance = Math.hypot(tcp.x - activeTarget.x, tcp.y - activeTarget.y, tcp.z - activeTarget.z);
  const atTarget = targetDistance <= 0.012;
  const mustLift = holdingPart && tcp.z < 0.74;
  const targetLabel = holdingPart ? "Bırakma noktası" : "Kavrama noktası";
  const nextStep = taskFinished
    ? "İş tamam. Programı oynatıp hareketi yeniden izle."
    : holdingPart
      ? mustLift ? "Önce Z+ ile parçayı güvenli yüksekliğe kaldır." : "Parçayı mavi tablaya taşı, sonra Z− ile indir."
      : atTarget
        ? "Parça merkezindesin. Gripper’ı kapat."
        : "X, Y ve Z tuşlarıyla turuncu parçaya ilerle.";
  const remaining = {
    x: activeTarget.x - tcp.x,
    y: activeTarget.y - tcp.y,
    z: activeTarget.z - tcp.z,
  };
  const jogButton = (axis: "x" | "y" | "z", direction: -1 | 1, label: string) => (
    <button
      type="button"
      aria-label={`${axis.toUpperCase()} ${direction > 0 ? "artı" : "eksi"}`}
      onClick={() => onJog(axis, direction * stepMetres)}
      disabled={playing || (mustLift && axis !== "z")}
      className="min-h-12 rounded-xl border border-site-border bg-site-surface px-3 text-sm font-bold text-site-ink transition hover:border-site-accent hover:bg-site-accent/10 disabled:opacity-40"
    >
      <span className="font-mono text-site-accent-text">{axis.toUpperCase()}{direction > 0 ? "+" : "−"}</span>
      <span className="ml-2 text-xs font-medium text-site-muted">{label}</span>
    </button>
  );

  return (
    <div role="tabpanel" aria-label="Al ve bırak">
      <p className="font-mono text-xs font-semibold uppercase tracking-[.16em] text-site-accent-text">Basit robot kumandası</p>
      <h3 className="mt-2 font-heading text-3xl font-semibold text-site-ink">Robotu adım adım sür</h3>
      <p className="mt-2 text-sm leading-6 text-site-muted">Uçtaki gripper her zaman aşağı bakar. X/Y/Z tuşları yalnız robotu sürer; program kendiliğinden değişmez. İşe yarayan konuma geldiğinde açıkça öğretirsin.</p>

      <div className="mt-4 rounded-2xl border border-site-accent bg-site-accent/10 p-4" aria-live="polite">
        <span className="block text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Sıradaki iş</span>
        <strong className="mt-1 block text-base text-site-ink">{nextStep}</strong>
        <span className="mt-1 block text-xs leading-5 text-site-muted">{directStatus}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2" aria-label="Jog hassasiyeti">
        <button type="button" aria-pressed={stepMetres === 0.05} onClick={() => setStepMetres(0.05)} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${stepMetres === 0.05 ? "border-site-accent bg-site-accent text-site-on-accent" : "border-site-border text-site-muted"}`}>Normal 5 cm</button>
        <button type="button" aria-pressed={stepMetres === 0.01} onClick={() => setStepMetres(0.01)} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${stepMetres === 0.01 ? "border-site-accent bg-site-accent text-site-on-accent" : "border-site-border text-site-muted"}`}>Hassas 1 cm</button>
      </div>

      <div className="mt-3 rounded-2xl border border-site-border bg-site-soft p-4">
        <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs" aria-label="Gripper koordinatları">
          {(["x", "y", "z"] as const).map((axis) => (
            <div key={axis} className="rounded-xl bg-site-surface p-2 text-site-muted"><strong className="block text-site-ink">{axis.toUpperCase()}</strong>{formatCoordinate(tcp[axis])} m</div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {jogButton("x", -1, "sol")}{jogButton("x", 1, "sağ")}
          {jogButton("y", -1, "geri")}{jogButton("y", 1, "ileri")}
          {jogButton("z", -1, "aşağı")}{jogButton("z", 1, "yukarı")}
        </div>
      </div>

      <div className={`mt-3 rounded-xl border p-3 ${atTarget || taskFinished ? "border-site-accent bg-site-accent/10" : "border-site-border bg-site-soft"}`} aria-live="polite">
        <strong className="block text-sm text-site-ink">{taskFinished ? "Parça bırakma tablasında" : atTarget ? `${targetLabel}nda` : `${targetLabel}na kalan`}</strong>
        {!taskFinished && <span className="mt-1 block font-mono text-xs text-site-muted">X {remaining.x >= 0 ? "+" : ""}{formatCoordinate(remaining.x)} · Y {remaining.y >= 0 ? "+" : ""}{formatCoordinate(remaining.y)} · Z {remaining.z >= 0 ? "+" : ""}{formatCoordinate(remaining.z)} m</span>}
      </div>

      <button type="button" onClick={gripperClosed ? onRelease : onGrip} disabled={taskFinished || playing || (!gripperClosed && !grip.canGrip)} className="mt-3 min-h-14 w-full rounded-xl bg-site-accent px-3 text-sm font-bold text-site-on-accent disabled:opacity-40">{taskFinished ? "Al-bırak tamamlandı" : gripperClosed ? "Gripper’ı aç · bırak" : "Gripper’ı kapat · kavra"}</button>

      <div className="mt-3 rounded-2xl border border-site-accent bg-site-accent/10 p-3">
        <span className="block text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Bir karar ver, sonra öğret</span>
        <button type="button" onClick={onSavePose} disabled={playing} className="mt-2 min-h-12 w-full rounded-xl bg-site-accent px-3 text-sm font-bold text-site-on-accent disabled:opacity-40">Bu noktayı öğret</button>
        <p className="mt-2 text-xs leading-5 text-site-muted">Bulunduğun TCP konumu tek bir hareket adımı olur. Kavrama ve bırakma düğmeleri de yalnız geçerli olduklarında kendi kritik adımlarını ekler.</p>
      </div>

      <button type="button" onClick={onRepair} disabled={commands.length === 0 || playing} className="mt-2 min-h-11 w-full rounded-xl border border-site-border bg-site-soft px-3 text-sm font-semibold text-site-ink disabled:opacity-35">Kaydı denetle ve sadeleştir</button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={onReset} disabled={playing} className="min-h-11 rounded-xl border border-site-border px-3 text-sm font-semibold text-site-ink disabled:opacity-40">Robotu başa al</button>
        <button type="button" onClick={onClear} disabled={commands.length === 0 || playing} className="min-h-11 rounded-xl border border-site-border px-3 text-sm font-semibold text-site-muted disabled:opacity-35">Programı temizle</button>
      </div>

      <div className="mt-5 rounded-2xl border border-site-border bg-site-soft p-3">
        <label htmlFor="robot-cell-program-name" className="text-xs font-semibold uppercase tracking-[.14em] text-site-subtle">Program adı</label>
        <input id="robot-cell-program-name" aria-label="Program adı" value={programName} maxLength={48} onChange={(event) => onProgramNameChange(event.target.value)} disabled={playing} className="mt-2 min-h-11 w-full rounded-xl border border-site-border bg-site-surface px-3 text-sm font-semibold text-site-ink outline-none focus:border-site-accent disabled:opacity-45" />
        <p className="mt-2 text-xs text-site-muted" aria-live="polite">{storageStatus}</p>
      </div>

      <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-site-subtle">Öğretilen iş</p><p className="mt-1 text-xs text-site-muted">{commands.length === 0 ? "Henüz adım yok · robotu sürmek kayıt oluşturmaz" : `${commands.length} adım · ${preflight.status === "ready" ? "çalışmaya hazır" : "kontrol gerekli"}`}</p></div>
      <ol aria-label="Basit al ve bırak programı" className="mt-3 grid gap-2">
        {commands.map((command, index) => {
          const selected = command.id === selectedCommandId;
          const step = preflight.steps[index];
          return (
            <li key={command.id} className={`rounded-xl border p-2 ${selected ? "border-site-accent bg-site-accent/10" : step?.status === "blocked" ? "border-rose-400/60 bg-rose-950/10" : "border-site-border bg-site-surface"}`}>
              <div className="flex min-h-11 items-center gap-2">
                <button type="button" aria-label={`${index + 1}. adımı seç: ${taskLabel(command)}`} aria-pressed={selected} onClick={() => onSelectCommand(command.id)} disabled={playing} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left disabled:opacity-45">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-site-soft font-mono text-xs font-bold">{index + 1}</span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-site-ink">{taskLabel(command)}</strong><span className="text-xs text-site-subtle">{step?.status === "blocked" ? "ön kontrol engelledi" : command.type === "move" ? "hareket · hedefi görmek için seç" : "gripper"}</span></span>
                </button>
                <button type="button" aria-label={`${index + 1}. adımı sil`} onClick={() => onRemoveCommand(command.id)} disabled={playing} className="min-h-11 min-w-11 rounded-lg text-lg text-site-muted hover:bg-site-soft disabled:opacity-35">×</button>
              </div>
              {selected && (
                <div className="mt-2 border-t border-site-border pt-2">
                  <p className="px-1 text-xs font-semibold text-site-accent-text">{index + 1}. adım seçili · hareket hedefi sahnede sarı işaretle gösteriliyor.</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" aria-label="Seçili adımı yukarı taşı" onClick={() => onMoveCommand(command.id, -1)} disabled={playing || index === 0} className="min-h-11 rounded-lg border border-site-border text-xs font-semibold text-site-ink disabled:opacity-35">↑ Yukarı</button>
                    <button type="button" aria-label="Seçili adımı aşağı taşı" onClick={() => onMoveCommand(command.id, 1)} disabled={playing || index === commands.length - 1} className="min-h-11 rounded-lg border border-site-border text-xs font-semibold text-site-ink disabled:opacity-35">↓ Aşağı</button>
                  </div>
                  {command.type === "move" && <button type="button" onClick={onOverwriteSelected} disabled={playing} className="mt-2 min-h-11 w-full rounded-lg border border-site-accent bg-site-surface px-3 text-xs font-bold text-site-accent-text disabled:opacity-35">Bu adımı geçerli pozla güncelle</button>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
