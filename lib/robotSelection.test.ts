import { describe, expect, it } from "vitest";
import { ROBOT_CANDIDATES, ROBOT_TASKS, evaluateCandidate, evaluateTask, withLayoutChange } from "./robotSelection";

describe("robot seçim karar motoru", () => {
  it("elektronik görevinde birden fazla savunulabilir aday bırakır", () => {
    const results = evaluateTask(ROBOT_TASKS[0]);
    expect(results.filter((result) => result.status !== "fail")).toHaveLength(3);
    expect(results[0].constraints.filter((result) => result.quantitative)).toHaveLength(4);
  });

  it("cobot etiketini otomatik güvenlik onayı saymaz", () => {
    const task = ROBOT_TASKS[1];
    const ur10e = ROBOT_CANDIDATES.find((candidate) => candidate.id === "ur10e")!;
    const result = evaluateCandidate(task, ur10e);
    expect(result.status).toBe("review");
    expect(result.constraints.find((constraint) => constraint.key === "shared-workspace")?.status).toBe("review");
  });

  it("tek yerleşim kısıtı değişince manyetik kılavuzlu adayı eler", () => {
    const stable = ROBOT_TASKS[2];
    const changing = withLayoutChange(stable, true);
    const k05 = ROBOT_CANDIDATES.find((candidate) => candidate.id === "kivnon-k05")!;
    expect(evaluateCandidate(stable, k05).status).toBe("review");
    expect(evaluateCandidate(changing, k05).status).toBe("fail");
    expect(evaluateCandidate(changing, k05).constraints.find((constraint) => constraint.key === "navigation")?.status).toBe("fail");
  });

  it("her sayısal ölçümü izlenebilir bir kaynağa bağlar", () => {
    for (const candidate of ROBOT_CANDIDATES) {
      for (const fact of Object.values(candidate.facts)) {
        expect(candidate.sourceIds).toContain(fact?.sourceId);
      }
    }
  });
});
