import { createCollisionChecker, type Obstacle } from "@/lib/robotics/collision";
import { createPlanner, type PlanResult, type PlannerFactoryOptions, type PlannerId } from "@/lib/robotics/planners";
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
  start: Vec3;
  goal: Vec3;
  obstacles: Obstacle[];
  options?: PlannerFactoryOptions;
}

export interface PlannerWorkerResponse {
  requestId: string;
  result: PlanResult;
}

// "dom" ve "webworker" TS lib'leri aynı projede çakıştığı için (tsconfig.json
// sadece "dom" içeriyor), worker global scope'u burada dar bir arayüzle
// tanımlıyoruz — self'in gerçek çalışma zamanı davranışını değiştirmez.
const ctx = self as unknown as {
  postMessage: (message: PlannerWorkerResponse) => void;
  onmessage: ((event: MessageEvent<PlannerWorkerRequest>) => void) | null;
};

ctx.onmessage = (event) => {
  const { requestId, algorithm, start, goal, obstacles, options } = event.data;
  const planner = createPlanner(algorithm, options);
  const result = planner.plan(start, goal, createCollisionChecker(obstacles));
  ctx.postMessage({ requestId, result });
};
