import { describe, expect, it } from "vitest";
import { runBlockProgram, type Block } from "./blockProgram";

describe("runBlockProgram", () => {
  it("move bloğu ilgili eklemi mutlak açıya ayarlar", () => {
    const blocks: Block[] = [{ id: "1", type: "move", joint: 0, degrees: 90 }];
    const trace = runBlockProgram(blocks, 2, { engelVar: false });
    expect(trace).toHaveLength(1);
    expect(trace[0][0]).toBeCloseTo(Math.PI / 2, 6);
    expect(trace[0][1]).toBeCloseTo(0, 6);
  });

  it("aynı eklemi iki kez ayarlarsa son değer kazanır", () => {
    const blocks: Block[] = [
      { id: "1", type: "move", joint: 0, degrees: 30 },
      { id: "2", type: "move", joint: 0, degrees: 60 },
    ];
    const trace = runBlockProgram(blocks, 1, { engelVar: false });
    expect(trace).toHaveLength(2);
    expect(trace[1][0]).toBeCloseTo(Math.PI / 3, 6);
  });

  it("repeat bloğu içindeki komutları belirtilen sayıda tekrarlar", () => {
    const blocks: Block[] = [
      {
        id: "1",
        type: "repeat",
        times: 3,
        body: [{ id: "2", type: "move", joint: 0, degrees: 10 }],
      },
    ];
    const trace = runBlockProgram(blocks, 1, { engelVar: false });
    expect(trace).toHaveLength(3);
  });

  it("if bloğu engelVar true iken body'i, false iken elseBody'i çalıştırır", () => {
    const blocks: Block[] = [
      {
        id: "1",
        type: "if",
        body: [{ id: "2", type: "move", joint: 0, degrees: 45 }],
        elseBody: [{ id: "3", type: "move", joint: 0, degrees: -45 }],
      },
    ];
    const traceTrue = runBlockProgram(blocks, 1, { engelVar: true });
    expect(traceTrue[0][0]).toBeCloseTo(Math.PI / 4, 6);

    const traceFalse = runBlockProgram(blocks, 1, { engelVar: false });
    expect(traceFalse[0][0]).toBeCloseTo(-Math.PI / 4, 6);
  });

  it("jointCount dışındaki bir eklem indexi sessizce atlanır", () => {
    const blocks: Block[] = [{ id: "1", type: "move", joint: 5, degrees: 90 }];
    const trace = runBlockProgram(blocks, 2, { engelVar: false });
    expect(trace).toHaveLength(0);
  });

  it("boş program boş iz döner", () => {
    expect(runBlockProgram([], 2, { engelVar: false })).toEqual([]);
  });
});
