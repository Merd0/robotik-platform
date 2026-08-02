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
export function runBlockProgram(blocks: Block[], jointCount: number, context: BlockProgramContext): number[][] {
  const angles = new Array(jointCount).fill(0);
  const jointTrace: number[][] = [];

  function exec(list: Block[]) {
    for (const block of list) {
      if (block.type === "move") {
        if (block.joint < 0 || block.joint >= jointCount) continue;
        angles[block.joint] = (block.degrees * Math.PI) / 180;
        jointTrace.push([...angles]);
      } else if (block.type === "repeat") {
        for (let i = 0; i < block.times; i++) exec(block.body);
      } else if (block.type === "if") {
        exec(context.engelVar ? block.body : block.elseBody);
      }
    }
  }

  exec(blocks);
  return jointTrace;
}
