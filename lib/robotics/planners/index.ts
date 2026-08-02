import { AStarPlanner, type AStarOptions } from "./astar";
import { RrtPlanner, type RrtOptions } from "./rrt";
import { RrtStarPlanner, type RrtStarOptions } from "./rrtStar";

export type { PlanResult, Planner, CollisionChecker } from "./base";
export { pathLength, distance } from "./base";
export { AStarPlanner, type AStarOptions } from "./astar";
export { RrtPlanner, type RrtOptions } from "./rrt";
export { RrtStarPlanner, type RrtStarOptions } from "./rrtStar";

export type PlannerId = "astar" | "rrt" | "rrt_star";

export interface PlannerFactoryOptions {
  astar?: AStarOptions;
  rrt?: RrtOptions;
  rrt_star?: RrtStarOptions;
}

/** PlannerRace bileşeninin kullandığı, id'den taze bir planlayıcı örneği üreten fabrika. */
export function createPlanner(id: PlannerId, options: PlannerFactoryOptions = {}) {
  switch (id) {
    case "astar":
      return new AStarPlanner(options.astar);
    case "rrt":
      return new RrtPlanner(options.rrt);
    case "rrt_star":
      return new RrtStarPlanner(options.rrt_star);
  }
}

export const PLANNER_IDS: PlannerId[] = ["astar", "rrt", "rrt_star"];
