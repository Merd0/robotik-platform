/**
 * Ortaokul seviyesi Hat D için blok tabanlı komut yorumlayıcısı. Saf
 * TypeScript — DOM/React import yok (bkz. CLAUDE.md). `BlockEditor.tsx`
 * bunu kullanıp sonucu `RobotArm`'a sürer.
 *
 * `move` bloğu `eklem_ac(index, derece)` ile aynı mantıkta ÇALIŞIYOR:
 * ilgili eklemin açısını MUTLAK olarak ayarlıyor (üzerine eklemiyor) —
 * bu, D/Lise'deki Python API'siyle aynı zihin modelini (bkz.
 * pyodideWorker.ts) blok haliyle tekrar eder.
 */

export type Block =
  | { id: string; type: "move"; joint: number; degrees: number }
  | { id: string; type: "repeat"; times: number; body: Block[] }
  | { id: string; type: "if"; body: Block[]; elseBody: Block[] };

export interface BlockProgramContext {
  /** "if" bloğunun koşulu: kullanıcının açtığı/kapattığı "engel var" anahtarı. */
  engelVar: boolean;
}

/**
 * Blok listesini baştan sona yürütür, her `move` adımından sonra tüm
 * eklemlerin anlık açısını (radyan) `jointTrace`'e ekler — CodeRunner'daki
 * `jointTrace` ile aynı şekil, aynı tüketici (RobotArm animasyonu).
 */
export function runBlockProgram(
  blocks: Block[],
  jointCount: number,
  context: BlockProgramContext,
  maxTraceSteps = Number.POSITIVE_INFINITY,
): number[][] {
  if (!(maxTraceSteps > 0)) throw new Error("maxTraceSteps pozitif olmalı");
  const angles = new Array(jointCount).fill(0);
  const jointTrace: number[][] = [];
  let halted = false;

  function exec(list: Block[]) {
    for (const block of list) {
      if (halted) return;
      if (block.type === "move") {
        if (block.joint < 0 || block.joint >= jointCount) continue;
        angles[block.joint] = (block.degrees * Math.PI) / 180;
        jointTrace.push([...angles]);
        if (jointTrace.length >= maxTraceSteps) halted = true;
      } else if (block.type === "repeat") {
        for (let i = 0; i < block.times && !halted; i++) exec(block.body);
      } else if (block.type === "if") {
        exec(context.engelVar ? block.body : block.elseBody);
      }
    }
  }

  exec(blocks);
  return jointTrace;
}

export function blockPoseKey(angles: readonly number[]): string {
  return angles.map((angle) => angle.toFixed(6)).join(",");
}

export function countBlockType(blocks: readonly Block[], type: Block["type"]): number {
  return blocks.reduce((count, block) => {
    const nested = block.type === "repeat"
      ? countBlockType(block.body, type)
      : block.type === "if"
        ? countBlockType(block.body, type) + countBlockType(block.elseBody, type)
        : 0;
    return count + (block.type === type ? 1 : 0) + nested;
  }, 0);
}
