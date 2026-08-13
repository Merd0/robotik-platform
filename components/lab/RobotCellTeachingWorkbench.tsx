"use client";

import type { RobotCellMotionKind } from "@/lib/robotics/robotCellMotion";
import {
  type RobotCellProgramCommand,
  type RobotCellProgramPreflight,
} from "@/lib/robotics/robotCellProgram";

function commandLabel(command: RobotCellProgramCommand): string {
  if (command.type === "gripper") return command.action === "open" ? "Tutucuyu aç" : "Tutucuyu kapat";
  return `${command.pose.id} · ${command.pose.label}`;
}

function issueLabel(preflight: RobotCellProgramPreflight): string {
  const issue = preflight.firstIssue;
  if (!issue) return "";
  if (issue.reason === "collision") return `${issue.commandIndex + 1}. satır ${issue.obstacleLabel ?? "hücre elemanı"} ile temas ediyor.`;
  if (issue.reason === "grip-zone") return `${issue.commandIndex + 1}. satırda tutucu parçanın kavrama bölgesinde değil.`;
  if (issue.reason === "ik-failure") return `${issue.commandIndex + 1}. satırın MoveL ara noktası çözülemedi.`;
  if (issue.reason === "joint-limit") return `${issue.commandIndex + 1}. satır eklem limitini aşıyor.`;
  if (issue.reason === "already-holding") return `${issue.commandIndex + 1}. satırda tutucu zaten parça taşıyor.`;
  return `${issue.commandIndex + 1}. satırda bırakılacak bir parça yok.`;
}

export function RobotCellTeachingWorkbench({
  selectedMotion,
  commands,
  preflight,
  playing,
  activeCommandIndex,
  onSelectMotion,
  onTeachPose,
  onAddGripper,
  onRemoveCommand,
  onClear,
  onLoadSample,
}: {
  selectedMotion: RobotCellMotionKind;
  commands: readonly RobotCellProgramCommand[];
  preflight: RobotCellProgramPreflight;
  playing: boolean;
  activeCommandIndex: number | null;
  onSelectMotion: (kind: RobotCellMotionKind) => void;
  onTeachPose: () => void;
  onAddGripper: (action: "open" | "close") => void;
  onRemoveCommand: (id: string) => void;
  onClear: () => void;
  onLoadSample: () => void;
}) {
  const moveCount = commands.filter((command) => command.type === "move").length;
  return (
    <div role="tabpanel" aria-label="İşi öğret" className="pb-2">
      <p className="font-mono text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Teach pendant · program masası</p>
      <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-site-ink">Robot işini adım adım öğret</h3>
      <p className="mt-2 text-sm leading-6 text-site-muted">Önce robotu prova zaman çizgisinde bir poza getir. Sonra bu pozu programa ekle; hareket türü ve tutucu komutları satır satır ön kontrolden geçsin.</p>

      <div className="mt-5 rounded-2xl border border-site-border bg-site-soft p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-site-subtle"><span className="grid size-6 place-items-center rounded-full bg-site-strong font-mono text-site-on-strong">1</span>Hareket türünü belirle</div>
        <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Öğretilecek hareket türü">
          <button type="button" aria-pressed={selectedMotion === "movej"} onClick={() => onSelectMotion("movej")} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${selectedMotion === "movej" ? "border-violet-500 bg-violet-500/10 text-site-ink" : "border-site-border text-site-muted"}`}>MoveJ öğret</button>
          <button type="button" aria-pressed={selectedMotion === "movel"} onClick={() => onSelectMotion("movel")} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${selectedMotion === "movel" ? "border-teal-500 bg-teal-500/10 text-site-ink" : "border-site-border text-site-muted"}`}>MoveL öğret</button>
        </div>
        <button type="button" onClick={onTeachPose} disabled={playing} className="mt-3 min-h-11 w-full rounded-xl bg-site-accent px-4 text-sm font-bold text-site-on-accent disabled:opacity-45">Geçerli pozu öğret</button>
        <p className="mt-2 text-xs leading-5 text-site-subtle">MoveL bu sürümde TCP konumunu doğrusal izler; takım yönelimini sabit tutan tam 6B IK değildir.</p>
      </div>

      <div className="mt-4 rounded-2xl border border-site-border bg-site-soft p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-site-subtle"><span className="grid size-6 place-items-center rounded-full bg-site-strong font-mono text-site-on-strong">2</span>Tutucu komutu ekle</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onAddGripper("open")} disabled={playing} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-sm font-semibold text-site-ink disabled:opacity-45">Tutucuyu aç</button>
          <button type="button" onClick={() => onAddGripper("close")} disabled={playing} className="min-h-11 rounded-xl border border-site-border bg-site-surface px-3 text-sm font-semibold text-site-ink disabled:opacity-45">Tutucuyu kapat</button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-site-subtle">Program şeridi</p>
          <p className="mt-1 text-xs text-site-muted">{commands.length === 0 ? "Henüz komut yok" : `${commands.length} komut · ${moveCount} hareket`}</p>
        </div>
        <button type="button" onClick={onClear} disabled={commands.length === 0 || playing} className="min-h-11 rounded-xl px-3 text-xs font-semibold text-site-muted disabled:opacity-35">Programı temizle</button>
      </div>

      {commands.length === 0 && <button type="button" onClick={onLoadSample} className="mt-3 min-h-11 w-full rounded-xl border border-site-border bg-site-surface px-4 text-sm font-semibold text-site-ink">Örnek al-bırak işini yükle</button>}

      <ol aria-label="Öğretilen robot programı" className="mt-3 grid gap-2">
        {commands.map((command, index) => {
          const step = preflight.steps[index];
          const active = activeCommandIndex === index;
          const blocked = step?.status === "blocked";
          return (
            <li key={command.id} className={`grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-3 py-2 ${active ? "border-site-accent bg-site-accent/10" : blocked ? "border-rose-400/60 bg-rose-950/10" : "border-site-border bg-site-surface"}`}>
              <span className="grid size-8 place-items-center rounded-lg bg-site-soft font-mono text-xs font-bold text-site-ink">{index + 1}</span>
              <span className="min-w-0"><strong className="block truncate text-sm text-site-ink">{commandLabel(command)}</strong><span className={`text-xs ${blocked ? "text-rose-700 dark:text-rose-300" : "text-site-subtle"}`}>{command.type === "move" ? `${command.motion === "movej" ? "MoveJ" : "MoveL"} · ` : ""}{blocked ? "ön kontrol engelledi" : step?.status === "not-checked" ? "önceki hata çözülmeli" : "hazır"}</span></span>
              <button type="button" aria-label={`${index + 1}. komutu sil`} onClick={() => onRemoveCommand(command.id)} disabled={playing} className="min-h-11 min-w-11 rounded-lg text-lg text-site-muted hover:bg-site-soft disabled:opacity-35">×</button>
            </li>
          );
        })}
      </ol>

      <div className={`mt-4 rounded-2xl border p-4 ${preflight.status === "ready" ? "border-success-border bg-success-surface" : preflight.status === "blocked" ? "border-rose-400/60 bg-rose-950/10" : "border-site-border bg-site-soft"}`} aria-live="polite">
        <strong className={`block text-sm ${preflight.status === "ready" ? "text-success-ink" : preflight.status === "blocked" ? "text-rose-700 dark:text-rose-300" : "text-site-ink"}`}>
          {preflight.status === "ready" ? `${moveCount} hareket · ön kontrol temiz` : preflight.status === "blocked" ? "Program oynatılamıyor" : "Önce bir poz öğret"}
        </strong>
        <span className="mt-1 block text-xs leading-5 text-site-muted">{preflight.status === "ready" ? `Teorik hareket alt sınırı ${preflight.estimatedDurationSeconds.toFixed(2)} saniye.` : preflight.status === "blocked" ? issueLabel(preflight) : "Öğretilen her satır burada yol ve hücre temasına karşı denetlenecek."}</span>
      </div>

    </div>
  );
}

export function RobotCellProgramTransport({
  commandCount,
  preflight,
  playing,
  activeCommandIndex,
  completed,
  gripperClosed,
  onPlay,
}: {
  commandCount: number;
  preflight: RobotCellProgramPreflight;
  playing: boolean;
  activeCommandIndex: number | null;
  completed: boolean;
  gripperClosed: boolean;
  onPlay: () => void;
}) {
  const status = activeCommandIndex === null
    ? completed ? `Program tamamlandı · ${commandCount} satır` : "Program bekliyor"
    : `Satır ${activeCommandIndex + 1}/${commandCount} yürütülüyor`;
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
      <button type="button" onClick={onPlay} disabled={preflight.status !== "ready"} className="min-h-11 min-w-44 rounded-xl bg-teal-300 px-4 text-sm font-bold text-slate-950 disabled:opacity-40">{playing ? "Programı duraklat" : "Programı oynat"}</button>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-200"><strong>{status}</strong><span className="font-mono">Tutucu {gripperClosed ? "kapalı · parça bağlı" : "açık"}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700" aria-hidden="true"><div className="h-full bg-teal-300 transition-[width]" style={{ width: commandCount === 0 ? "0%" : `${((activeCommandIndex ?? (completed ? commandCount : 0)) / commandCount) * 100}%` }} /></div>
      </div>
    </div>
  );
}
