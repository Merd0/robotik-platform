import type { PlannerWorkerRequest, PlannerWorkerResponse } from "./plannerWorker";

export const PLANNER_TIMEOUT_MS = 5_000;

interface PlannerWorkerLike {
  addEventListener(type: "message", listener: (event: MessageEvent<PlannerWorkerResponse>) => void): void;
  addEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent<PlannerWorkerResponse>) => void): void;
  removeEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  postMessage(request: PlannerWorkerRequest): void;
  terminate(): void;
}

interface RunPlannerOptions {
  timeoutMs?: number;
  createWorker?: () => PlannerWorkerLike;
}

export function runPlannerInWorker(
  request: PlannerWorkerRequest,
  options: RunPlannerOptions = {},
): Promise<PlannerWorkerResponse> {
  const worker: PlannerWorkerLike = options.createWorker?.() ?? new Worker("/workers/planner-worker.js");
  const timeoutMs = options.timeoutMs ?? PLANNER_TIMEOUT_MS;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (response: PlannerWorkerResponse) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.terminate();
      resolve(response);
    };
    const onMessage = (event: MessageEvent<PlannerWorkerResponse>) => {
      if (event.data.requestId === request.requestId) finish(event.data);
    };
    const onError = (event: ErrorEvent) =>
      finish({
        requestId: request.requestId,
        status: "error",
        error: { code: "worker-error", message: event.message || "Planlayıcı worker başlatılamadı." },
      });
    const timeout = setTimeout(
      () =>
        finish({
          requestId: request.requestId,
          status: "error",
          error: { code: "timeout", message: `Planlama ${timeoutMs / 1000} saniyede tamamlanamadı.` },
        }),
      timeoutMs,
    );

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage(request);
  });
}
