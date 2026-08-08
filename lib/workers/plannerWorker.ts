import { createCollisionChecker, type Obstacle } from "@/lib/robotics/collision";
import { createPlanner, type PlanResult, type PlannerFactoryOptions, type PlannerId } from "@/lib/robotics/planners";
import { validatePlanResult } from "@/lib/robotics/planners/validatePlanResult";
import { createSeededRandom } from "@/lib/robotics/random";
import type { Vec3 } from "@/lib/robotics/transform";

/**
 * Planlama algoritmalarını Web Worker içinde çalıştırır — ana thread'i
 * kilitlemesin diye (bkz. docs/02-mimari.md "Performans sınırları").
 * `lib/robotics/` saf kalır (self/postMessage burada, tarayıcıya özel
 * bağlantı katmanında), bu dosya bilerek o klasörün dışında.
 */

export interface PlannerWorkerRequest {
  requestId: string;
  algorithm: PlannerId;
  seed: number;
  start: Vec3;
  goal: Vec3;
  obstacles: Obstacle[];
  options?: PlannerFactoryOptions;
}

export type PlannerWorkerResponse =
  | { requestId: string; status: "success"; result: PlanResult }
  | {
      requestId: string;
      status: "error";
      error: { code: "invalid-result" | "planner-error" | "worker-error" | "timeout"; message: string };
    };

// "dom" ve "webworker" TS lib'leri aynı projede çakıştığı için (tsconfig.json
// sadece "dom" içeriyor), worker global scope'u burada dar bir arayüzle
// tanımlıyoruz — self'in gerçek çalışma zamanı davranışını değiştirmez.
const ctx = self as unknown as {
  postMessage: (message: PlannerWorkerResponse) => void;
  onmessage: ((event: MessageEvent<PlannerWorkerRequest>) => void) | null;
};

ctx.onmessage = (event) => {
  const { requestId, algorithm, seed, start, goal, obstacles, options = {} } = event.data;
  try {
    if (!Number.isSafeInteger(seed)) throw new Error("Seed güvenli bir tam sayı olmalı.");
    const random = createSeededRandom(seed);
    const deterministicOptions: PlannerFactoryOptions = {
      ...options,
      rrt: { ...options.rrt, random },
      rrt_star: { ...options.rrt_star, random },
    };
    const planner = createPlanner(algorithm, deterministicOptions);
    const result = planner.plan(start, goal, createCollisionChecker(obstacles));
    const planar =
      algorithm === "astar"
        ? options.astar?.planar
        : algorithm === "rrt"
          ? options.rrt?.planar
          : options.rrt_star?.planar;
    const validation = validatePlanResult(result, start, goal, obstacles, { planar });
    if (!validation.valid) {
      ctx.postMessage({ requestId, status: "error", error: { code: "invalid-result", message: validation.reason } });
      return;
    }
    ctx.postMessage({ requestId, status: "success", result });
  } catch (error) {
    ctx.postMessage({
      requestId,
      status: "error",
      error: { code: "planner-error", message: error instanceof Error ? error.message : String(error) },
    });
  }
};
