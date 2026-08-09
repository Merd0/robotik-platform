"use client";

import { useMemo, useRef, useState } from "react";
import { RobotArm, SahneAlani } from "@/components/scene/LazyScene";
import { getRobotById } from "@/lib/robotics/robots";
import { runBlockProgram, type Block } from "@/lib/robotics/blockProgram";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";

type BlockType = Block["type"];

interface BlockEditorProps {
  robot: string;
  /** Hangi blok türleri palette'te görünsün. Belirtilmezse hepsi. */
  allowedBlocks?: BlockType[];
  task?: "sequence" | "condition";
}

const MAX_TRACE_STEPS = 200;
const STEP_MS = 600;

function findAndUpdate(blocks: Block[], id: string, updater: (block: Block) => Block): Block[] {
  return blocks.map((block) => {
    if (block.id === id) return updater(block);
    if (block.type === "repeat") return { ...block, body: findAndUpdate(block.body, id, updater) };
    if (block.type === "if") {
      return {
        ...block,
        body: findAndUpdate(block.body, id, updater),
        elseBody: findAndUpdate(block.elseBody, id, updater),
      };
    }
    return block;
  });
}

function removeById(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => {
      if (block.type === "repeat") return { ...block, body: removeById(block.body, id) };
      if (block.type === "if") {
        return { ...block, body: removeById(block.body, id), elseBody: removeById(block.elseBody, id) };
      }
      return block;
    });
}

function insertInto(blocks: Block[], parentId: string | null, branch: "body" | "elseBody", newBlock: Block): Block[] {
  if (parentId === null) return [...blocks, newBlock];
  return blocks.map((block) => {
    if (block.id === parentId && block.type === "repeat") return { ...block, body: [...block.body, newBlock] };
    if (block.id === parentId && block.type === "if") return { ...block, [branch]: [...block[branch], newBlock] };
    if (block.type === "repeat") return { ...block, body: insertInto(block.body, parentId, branch, newBlock) };
    if (block.type === "if") {
      return {
        ...block,
        body: insertInto(block.body, parentId, branch, newBlock),
        elseBody: insertInto(block.elseBody, parentId, branch, newBlock),
      };
    }
    return block;
  });
}

function hasBlockType(blocks: Block[], type: BlockType): boolean {
  return blocks.some((block) => block.type === type || (
    block.type === "repeat" ? hasBlockType(block.body, type) :
      block.type === "if" ? hasBlockType([...block.body, ...block.elseBody], type) : false
  ));
}

/**
 * Ortaokul seviyesi Hat D sahnesi: robotu tıkla-ekle bloklarla sürer
 * (yazılı kod yok). Yorumlayıcı `lib/robotics/blockProgram.ts`'de saf
 * TypeScript olarak yaşıyor; bu bileşen sadece ağaç düzenleme UI'ı ve
 * adım adım oynatma animasyonudur.
 */
export function BlockEditor({ robot: robotId, allowedBlocks, task }: BlockEditorProps) {
  const record = useEvidenceRecorder();
  const robot = useMemo(() => getRobotById(robotId), [robotId]);
  const allowed = allowedBlocks ?? ["move", "repeat", "if"];
  const idCounter = useRef(0);
  const nextId = () => `blok-${++idCounter.current}`;

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [engelVar, setEngelVar] = useState(false);
  const [jointAngles, setJointAngles] = useState<number[]>(() => robot.joints.map(() => 0));
  const [running, setRunning] = useState(false);
  const [trace, setTrace] = useState<number[][]>([]);
  const [traceIndex, setTraceIndex] = useState(0);
  const [conditionRuns, setConditionRuns] = useState({ trueBranch: false, falseBranch: false });
  const [taskPassed, setTaskPassed] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function addBlock(type: BlockType, parentId: string | null, branch: "body" | "elseBody" = "body") {
    const newBlock: Block =
      type === "move"
        ? { id: nextId(), type: "move", joint: 0, degrees: 45 }
        : type === "repeat"
          ? { id: nextId(), type: "repeat", times: 2, body: [] }
          : { id: nextId(), type: "if", body: [], elseBody: [] };
    setBlocks((prev) => insertInto(prev, parentId, branch, newBlock));
  }

  function updateBlock(id: string, updater: (block: Block) => Block) {
    setBlocks((prev) => findAndUpdate(prev, id, updater));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => removeById(prev, id));
  }

  function stopPlayback() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setRunning(false);
  }

  function handleRun() {
    stopPlayback();
    const nextTrace = runBlockProgram(blocks, robot.joints.length, { engelVar }).slice(0, MAX_TRACE_STEPS);
    if (nextTrace.length === 0) return;
    setTrace(nextTrace);
    setTraceIndex(0);
    const nextRuns = hasBlockType(blocks, "if")
      ? { trueBranch: conditionRuns.trueBranch || engelVar, falseBranch: conditionRuns.falseBranch || !engelVar }
      : conditionRuns;
    const distinctTraceSteps = new Set(nextTrace.map((angles) => angles.map((angle) => angle.toFixed(6)).join(","))).size;
    setConditionRuns(nextRuns);
    const passed = task === "sequence"
      ? distinctTraceSteps >= 2
      : task === "condition"
        ? nextRuns.trueBranch && nextRuns.falseBranch
        : false;
    setTaskPassed(passed);
    record({
      skillId: task === "condition" ? "block-condition" : "block-sequence",
      stage: task ? "assessed" : "observed",
      result: !task || passed ? "success" : "retry",
      metrics: { traceSteps: nextTrace.length, distinctTraceSteps, trueBranch: nextRuns.trueBranch, falseBranch: nextRuns.falseBranch },
    });
    setRunning(true);
    nextTrace.forEach((angles, index) => {
      const timeoutId = setTimeout(() => {
        setJointAngles(angles);
        setTraceIndex(index);
        if (index === nextTrace.length - 1) setRunning(false);
      }, index * STEP_MS);
      timeoutsRef.current.push(timeoutId);
    });
  }

  function handleReset() {
    stopPlayback();
    setBlocks([]);
    setJointAngles(robot.joints.map(() => 0));
    setTrace([]);
    setTraceIndex(0);
    setConditionRuns({ trueBranch: false, falseBranch: false });
    setTaskPassed(false);
  }

  function showTraceStep(index: number) {
    if (trace.length === 0) return;
    stopPlayback();
    const bounded = Math.max(0, Math.min(trace.length - 1, index));
    setTraceIndex(bounded);
    setJointAngles(trace[bounded]);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ortaokul-ink/10 bg-ortaokul-surface p-4">
      <SahneAlani className="aspect-video w-full overflow-hidden rounded-lg bg-ortaokul-bg">
        <RobotArm robot={robot} jointAngles={jointAngles} />
      </SahneAlani>

      {task && <p className="rounded-lg border border-ortaokul-ink/15 bg-ortaokul-bg p-3 text-sm"><span className="font-bold">Görev:</span> {task === "sequence" ? "En az iki hareket komutu kur; sonra çalışma izinde iki ayrı duruşu göster." : "Bir Eğer/Değilse bloğu kur; Engel var anahtarı kapalı ve açıkken iki dalı da çalıştır."}</p>}

      {allowed.includes("if") && (
        <label className="flex h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={engelVar}
            onChange={(event) => setEngelVar(event.target.checked)}
          />
          Engel var
        </label>
      )}

      <BlockListView
        blocks={blocks}
        robotJointCount={robot.joints.length}
        allowed={allowed}
        parentId={null}
        onAdd={addBlock}
        onUpdate={updateBlock}
        onRemove={removeBlock}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={running || blocks.length === 0}
          className="h-11 rounded-md bg-ortaokul-ink px-4 text-ortaokul-surface disabled:opacity-50"
        >
          {running ? "Çalışıyor…" : "Çalıştır"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="h-11 rounded-md border border-ortaokul-ink/20 px-4"
        >
          Sıfırla
        </button>
      </div>

      {trace.length > 0 && <div className="rounded-lg border border-ortaokul-ink/15 bg-ortaokul-bg p-3">
        <p className="text-sm font-semibold">Adım adım iz · {traceIndex + 1}/{trace.length}</p>
        <p className="mt-1 font-mono text-xs">{trace[traceIndex].map((angle, index) => `Eklem ${index + 1}: ${(angle * 180 / Math.PI).toFixed(0)}°`).join(" · ")}</p>
        <input aria-label="Blok programı iz adımı" type="range" min="0" max={trace.length - 1} value={traceIndex} onChange={(event) => showTraceStep(Number(event.target.value))} className="mt-2 h-11 w-full accent-ortaokul-accent" />
        <div className="flex gap-2"><button type="button" onClick={() => showTraceStep(traceIndex - 1)} className="min-h-11 flex-1 rounded-md border border-ortaokul-ink/20">Geri</button><button type="button" onClick={() => showTraceStep(traceIndex + 1)} className="min-h-11 flex-1 rounded-md border border-ortaokul-ink/20">İleri</button></div>
      </div>}
      {task && <p className={`rounded-lg border p-3 text-sm font-semibold ${taskPassed ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`} role="status">{taskPassed ? "Görev kanıtı oluştu." : task === "condition" ? `İki dalı da dene: Engel yok ${conditionRuns.falseBranch ? "✓" : "○"} · Engel var ${conditionRuns.trueBranch ? "✓" : "○"}` : "Çalışma izinde en az iki farklı robot duruşu gerekiyor."}</p>}
    </div>
  );
}

interface BlockListViewProps {
  blocks: Block[];
  robotJointCount: number;
  allowed: BlockType[];
  parentId: string | null;
  branch?: "body" | "elseBody";
  onAdd: (type: BlockType, parentId: string | null, branch?: "body" | "elseBody") => void;
  onUpdate: (id: string, updater: (block: Block) => Block) => void;
  onRemove: (id: string) => void;
}

function BlockListView({
  blocks,
  robotJointCount,
  allowed,
  parentId,
  branch = "body",
  onAdd,
  onUpdate,
  onRemove,
}: BlockListViewProps) {
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block) => (
        <BlockItemView
          key={block.id}
          block={block}
          robotJointCount={robotJointCount}
          allowed={allowed}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        {allowed.includes("move") && (
          <button
            type="button"
            onClick={() => onAdd("move", parentId, branch)}
            className="h-11 rounded-md border border-ortaokul-ink/20 px-3 text-sm"
          >
            + Hareket ekle
          </button>
        )}
        {allowed.includes("repeat") && (
          <button
            type="button"
            onClick={() => onAdd("repeat", parentId, branch)}
            className="h-11 rounded-md border border-ortaokul-ink/20 px-3 text-sm"
          >
            + Tekrarla ekle
          </button>
        )}
        {allowed.includes("if") && (
          <button
            type="button"
            onClick={() => onAdd("if", parentId, branch)}
            className="h-11 rounded-md border border-ortaokul-ink/20 px-3 text-sm"
          >
            + Eğer ekle
          </button>
        )}
      </div>
    </div>
  );
}

interface BlockItemViewProps {
  block: Block;
  robotJointCount: number;
  allowed: BlockType[];
  onAdd: (type: BlockType, parentId: string | null, branch?: "body" | "elseBody") => void;
  onUpdate: (id: string, updater: (block: Block) => Block) => void;
  onRemove: (id: string) => void;
}

function BlockItemView({ block, robotJointCount, allowed, onAdd, onUpdate, onRemove }: BlockItemViewProps) {
  if (block.type === "move") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-md bg-ortaokul-bg p-2 text-sm">
        <span>Eklemi</span>
        <select
          className="h-11 rounded border border-ortaokul-ink/20 px-2"
          value={block.joint}
          onChange={(event) =>
            onUpdate(block.id, (b) => (b.type === "move" ? { ...b, joint: Number(event.target.value) } : b))
          }
        >
          {Array.from({ length: robotJointCount }, (_, i) => (
            <option key={i} value={i}>
              Eklem {i + 1}
            </option>
          ))}
        </select>
        <span>şuna döndür:</span>
        <input
          type="number"
          step={5}
          className="h-11 w-20 rounded border border-ortaokul-ink/20 px-2"
          value={block.degrees}
          onChange={(event) =>
            onUpdate(block.id, (b) => (b.type === "move" ? { ...b, degrees: Number(event.target.value) } : b))
          }
        />
        <span>°</span>
        <button
          type="button"
          onClick={() => onRemove(block.id)}
          aria-label="Bloğu sil"
          className="ml-auto h-11 w-11 rounded-md border border-ortaokul-ink/20"
        >
          ✕
        </button>
      </div>
    );
  }

  if (block.type === "repeat") {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-ortaokul-ink/20 p-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Tekrarla</span>
          <input
            type="number"
            min={1}
            max={20}
            className="h-11 w-16 rounded border border-ortaokul-ink/20 px-2"
            value={block.times}
            onChange={(event) =>
              onUpdate(block.id, (b) =>
                b.type === "repeat"
                  ? { ...b, times: Math.min(20, Math.max(1, Number(event.target.value))) }
                  : b,
              )
            }
          />
          <span>kez:</span>
          <button
            type="button"
            onClick={() => onRemove(block.id)}
            aria-label="Bloğu sil"
            className="ml-auto h-11 w-11 rounded-md border border-ortaokul-ink/20"
          >
            ✕
          </button>
        </div>
        <div className="ml-4">
          <BlockListView
            blocks={block.body}
            robotJointCount={robotJointCount}
            allowed={allowed}
            parentId={block.id}
            branch="body"
            onAdd={onAdd}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-ortaokul-ink/20 p-2">
      <div className="flex items-center gap-2 text-sm">
        <span>Eğer engel varsa</span>
        <button
          type="button"
          onClick={() => onRemove(block.id)}
          aria-label="Bloğu sil"
          className="ml-auto h-11 w-11 rounded-md border border-ortaokul-ink/20"
        >
          ✕
        </button>
      </div>
      <div className="ml-4">
        <BlockListView
          blocks={block.body}
          robotJointCount={robotJointCount}
          allowed={allowed}
          parentId={block.id}
          branch="body"
          onAdd={onAdd}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      </div>
      <div className="text-sm">Değilse:</div>
      <div className="ml-4">
        <BlockListView
          blocks={block.elseBody}
          robotJointCount={robotJointCount}
          allowed={allowed}
          parentId={block.id}
          branch="elseBody"
          onAdd={onAdd}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
