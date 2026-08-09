"""RRT* — RRT'nin yolu optimize eden hali."""

import time
from typing import Sequence

from backend.planners.base import Obstacle, PlanResult, Point
from backend.planners.rrt import RRTPlanner, _distance


class RRTStarPlanner(RRTPlanner):
    """Komsu yeniden baglama (rewire) ile yol maliyetini dusuren RRT varyanti."""

    name = "rrt_star"

    def __init__(self, collision_checker, rewire_radius: float = 0.15, **kwargs) -> None:
        super().__init__(collision_checker, **kwargs)
        self.rewire_radius = rewire_radius

    def plan(self, start: Point, goal: Point, obstacles: Sequence[Obstacle]) -> PlanResult:
        started_at = time.perf_counter()

        if not self.collision_checker(start) or not self.collision_checker(goal):
            return PlanResult(
                success=False, elapsed_seconds=time.perf_counter() - started_at, algorithm=self.name
            )

        bounds = self._workspace_bounds(start, goal)
        nodes = [start]
        parent = {start: None}
        cost = {start: 0.0}
        children = {start: set()}
        nodes_expanded = 0
        goal_candidates = []

        # Hedefe ulasan ilk dugumden sonra da aramaya devam ediyoruz; RRT'nin
        # aksine amac sadece bir yol degil, rewire ile giderek kisalan bir yol.
        for _ in range(self.max_iterations):
            nodes_expanded += 1
            sample = goal if self._rng.random() < self.goal_bias else self._sample(bounds)
            nearest = self._nearest(nodes, sample)
            new_point = self._steer(nearest, sample)

            if new_point in cost:
                continue
            if not self.collision_checker(new_point) or not self._segment_free(nearest, new_point):
                continue

            neighbors = [n for n in nodes if _distance(n, new_point) <= self.rewire_radius] or [nearest]

            best_parent = nearest
            best_cost = cost[nearest] + _distance(nearest, new_point)
            for neighbor in neighbors:
                candidate_cost = cost[neighbor] + _distance(neighbor, new_point)
                if candidate_cost < best_cost and self._segment_free(neighbor, new_point):
                    best_parent = neighbor
                    best_cost = candidate_cost

            nodes.append(new_point)
            parent[new_point] = best_parent
            cost[new_point] = best_cost
            children[new_point] = set()
            children[best_parent].add(new_point)

            for neighbor in neighbors:
                if neighbor == best_parent:
                    continue
                candidate_cost = best_cost + _distance(new_point, neighbor)
                if candidate_cost < cost[neighbor] and self._segment_free(new_point, neighbor):
                    previous_cost = cost[neighbor]
                    previous_parent = parent[neighbor]
                    if previous_parent is not None:
                        children[previous_parent].discard(neighbor)
                    parent[neighbor] = new_point
                    children[new_point].add(neighbor)
                    _propagate_descendant_costs(
                        neighbor, candidate_cost - previous_cost, children, cost
                    )

            if _distance(new_point, goal) <= self.goal_tolerance:
                if new_point == goal or self._segment_free(new_point, goal):
                    goal_candidates.append(new_point)

        best_goal_node = min(
            goal_candidates,
            key=lambda node: cost[node] + _distance(node, goal),
            default=None,
        )

        if best_goal_node is None:
            return PlanResult(
                success=False,
                path=[],
                elapsed_seconds=time.perf_counter() - started_at,
                nodes_expanded=nodes_expanded,
                algorithm=self.name,
            )

        path = self._build_path(parent, best_goal_node, start, goal)
        return PlanResult(
            success=True,
            path=path,
            elapsed_seconds=time.perf_counter() - started_at,
            nodes_expanded=nodes_expanded,
            algorithm=self.name,
        )


def _propagate_descendant_costs(root, delta, children, cost) -> None:
    """Rewire maliyet farkini kok ve tum torunlarina uygular."""
    pending = [root]
    while pending:
        node = pending.pop()
        cost[node] += delta
        pending.extend(children[node])
