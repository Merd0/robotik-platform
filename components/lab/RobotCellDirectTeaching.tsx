"use client";

import type { RobotCellGripAssessment, RobotCellProgramCommand, RobotCellProgramPreflight } from "@/lib/robotics/robotCellProgram";

function taskLabel(command: RobotCellProgramCommand): string {
  if (command.type === "gripper") return command.action === "close" ? "Parçayı kavra" : "Parçayı bırak";
  return command.pose.label;
}

export function RobotCellDirectTeaching({
  commands,
  preflight,
  grip,
  gripperClosed,
  holdingPart,
  directStatus,
  tcpHeight,
  toolAngleDegrees,
  playing,
  onGoAbovePart,
  onGoToPart,
  onGoAboveBin,
  onGrip,
  onRelease,
  onSaveMove,
  onHeightChange,
  onToolAngleChange,
  onClear,
}: {
  commands: readonly RobotCellProgramCommand[];
  preflight: RobotCellProgramPreflight;
  grip: RobotCellGripAssessment;
  gripperClosed: boolean;
  holdingPart: boolean;
  directStatus: string;
  tcpHeight: number;
  toolAngleDegrees: number;
  playing: boolean;
  onGoAbovePart: () => void;
  onGoToPart: () => void;
  onGoAboveBin: () => void;
  onGrip: () => void;
  onRelease: () => void;
  onSaveMove: () => void;
  onHeightChange: (height: number) => void;
  onToolAngleChange: (angle: number) => void;
  onClear: () => void;
}) {
  const lastCommand = commands.at(-1);
  const taskFinished = lastCommand?.type === "gripper" && lastCommand.action === "open";
  const nextStep = taskFinished ? "İş hazır. Aşağıdan programı oynat ve tamamını izle." : holdingPart ? "Gripper’ı mavi bırakma alanına götür." : gripperClosed ? "Tutucuyu aç veya programı çalıştır." : grip.canGrip ? "Konum doğru. Şimdi parçayı kavra." : "Gripper’ı turuncu parçanın üstüne getir.";
  return (
    <div role="tabpanel" aria-label="Al ve bırak">
      <p className="font-mono text-xs font-semibold uppercase tracking-[.16em] text-site-accent-text">Doğrudan öğretim</p>
      <h3 className="mt-2 font-heading text-3xl font-semibold text-site-ink">Gripper’ı götür, kavra, bırak</h3>
      <p className="mt-2 text-sm leading-6 text-site-muted">Gripper’ın avucunu tutup sürükle veya sahnede gitmesini istediğin noktaya tıkla. Aşağı-yukarı hareket için Z kaydırıcısını kullan. Hazır konumlar programa eklenir; elle seçtiğin konumu aşağıdaki düğmeyle kaydedersin.</p>

      <div className="mt-4 rounded-2xl border border-site-accent bg-site-accent/10 p-4" aria-live="polite">
        <span className="block text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Sıradaki iş</span>
        <strong className="mt-1 block text-base text-site-ink">{nextStep}</strong>
        <span className="mt-1 block text-xs leading-5 text-site-muted">{directStatus}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Kavrama hizası">
        <div className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold ${grip.positionAligned ? "border-site-accent bg-site-accent/10 text-site-accent-text" : "border-site-border bg-site-soft text-site-muted"}`}>
          {grip.positionAligned ? "Merkez hizalı" : "Merkezi yaklaştır"}
        </div>
        <div className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold ${grip.orientationAligned ? "border-site-accent bg-site-accent/10 text-site-accent-text" : "border-site-border bg-site-soft text-site-muted"}`}>
          {grip.orientationAligned ? "Bilek hizalı" : "Bileği döndür"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onGoAbovePart} disabled={playing} className="min-h-14 rounded-xl border border-site-border bg-site-surface px-3 text-sm font-semibold text-site-ink disabled:opacity-40"><span className="block">Parçanın üstüne git</span><span className="text-xs font-normal text-site-subtle">Güvenli yaklaş</span></button>
        <button type="button" onClick={onGoToPart} disabled={playing || holdingPart} className="min-h-14 rounded-xl border border-site-border bg-site-surface px-3 text-sm font-semibold text-site-ink disabled:opacity-40"><span className="block">Parçaya in</span><span className="text-xs font-normal text-site-subtle">Kavrama yüksekliği</span></button>
        <button type="button" onClick={onGoAboveBin} disabled={playing || !holdingPart} className="min-h-14 rounded-xl border border-site-border bg-site-surface px-3 text-sm font-semibold text-site-ink disabled:opacity-40"><span className="block">Bırakma alanına git</span><span className="text-xs font-normal text-site-subtle">Mavi kutunun üstü</span></button>
        <button type="button" onClick={gripperClosed ? onRelease : onGrip} disabled={playing || (!gripperClosed && !grip.canGrip)} className="min-h-14 rounded-xl bg-site-accent px-3 text-sm font-bold text-site-on-accent disabled:opacity-40">{gripperClosed ? "Gripper’ı aç · bırak" : "Gripper’ı kapat · kavra"}</button>
      </div>

      <div className="mt-3 grid gap-3 rounded-2xl border border-site-border bg-site-soft p-4">
        <label className="text-sm font-semibold text-site-ink">Gripper yüksekliği · <span className="font-mono">{tcpHeight.toFixed(2)} m</span>
          <input aria-label="Gripper yüksekliği" type="range" min="0.58" max="1.15" step="0.01" value={tcpHeight} onChange={(event) => onHeightChange(Number(event.target.value))} className="mt-1 h-11 w-full touch-pan-y accent-teal-600" />
        </label>
        <label className="text-sm font-semibold text-site-ink">Parmakların dönüşü · <span className="font-mono">{Math.round(toolAngleDegrees)}°</span>
          <input aria-label="Gripper dönüş açısı" type="range" min="-180" max="180" step="1" value={toolAngleDegrees} onChange={(event) => onToolAngleChange(Number(event.target.value))} className="mt-1 h-11 w-full touch-pan-y accent-teal-600" />
        </label>
      </div>

      <button type="button" onClick={onSaveMove} disabled={playing} className="mt-2 min-h-11 w-full rounded-xl border border-site-border px-4 text-sm font-semibold text-site-ink disabled:opacity-40">Bu konumu programa ekle</button>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-site-subtle">Öğretilen iş</p><p className="mt-1 text-xs text-site-muted">{commands.length === 0 ? "Henüz adım yok" : `${commands.length} adım · ${preflight.status === "ready" ? "çalışmaya hazır" : "kontrol gerekli"}`}</p></div>
        <button type="button" onClick={onClear} disabled={commands.length === 0 || playing} className="min-h-11 px-3 text-xs font-semibold text-site-muted disabled:opacity-35">Temizle</button>
      </div>
      <ol aria-label="Basit al ve bırak programı" className="mt-3 grid gap-2">
        {commands.map((command, index) => (
          <li key={command.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-site-border bg-site-surface px-3 py-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-site-soft font-mono text-xs font-bold">{index + 1}</span>
            <strong className="min-w-0 flex-1 truncate text-sm text-site-ink">{taskLabel(command)}</strong>
            <span className="text-xs text-site-subtle">{command.type === "move" ? "hareket" : "gripper"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
