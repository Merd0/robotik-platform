import { describe, expect, it, vi } from "vitest";
import type { PlannerWorkerRequest, PlannerWorkerResponse } from "./plannerWorker";
import { runPlannerInWorker } from "./runPlannerWorker";

class FakeWorker {
  message?: (event: MessageEvent<PlannerWorkerResponse>) => void;
  error?: (event: ErrorEvent) => void;
  terminate = vi.fn();
  addEventListener(type: "message" | "error", listener: ((event: MessageEvent<PlannerWorkerResponse>) => void) | ((event: ErrorEvent) => void)) {
    if (type === "message") this.message = listener as (event: MessageEvent<PlannerWorkerResponse>) => void;
    else this.error = listener as (event: ErrorEvent) => void;
  }
  removeEventListener() {}
  postMessage(request: PlannerWorkerRequest) {
    queueMicrotask(() => this.message?.({ data: { requestId: request.requestId, status: "success", result: { success: false, path: [], elapsedMs: 1, nodesExpanded: 1, algorithm: request.algorithm } } } as unknown as MessageEvent<PlannerWorkerResponse>));
  }
}

const request: PlannerWorkerRequest = {
  requestId: "one",
  algorithm: "astar",
  seed: 7,
  start: { x: 0, y: 0, z: 0 },
  goal: { x: 1, y: 1, z: 0 },
  obstacles: [],
};

describe("runPlannerInWorker", () => {
  it("her çalışmayı bitince worker'ı sonlandırır", async () => {
    const worker = new FakeWorker();
    const response = await runPlannerInWorker(request, { createWorker: () => worker });
    expect(response.status).toBe("success");
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("süre aşımında worker'ı sonlandırır ve yapılandırılmış hata döndürür", async () => {
    vi.useFakeTimers();
    const worker = new FakeWorker();
    worker.postMessage = () => {};
    const pending = runPlannerInWorker(request, { timeoutMs: 10, createWorker: () => worker });
    await vi.advanceTimersByTimeAsync(10);
    await expect(pending).resolves.toMatchObject({ status: "error", error: { code: "timeout" } });
    expect(worker.terminate).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
