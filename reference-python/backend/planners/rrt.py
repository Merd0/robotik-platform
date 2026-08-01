"""RRT — rastgele örneklemeli yol arama."""

import random
import time
from typing import Optional, Sequence

from backend.planners.base import Obstacle, PlanResult, Planner, Point


def _distance(a: Point, b: Point) -> float:
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


class RRTPlanner(Planner):
    """Rastgele ağaç genişletme (Rapidly-exploring Random Tree) ile yol arar."""

    name = "rrt"

    def __init__(
        self,
        collision_checker,
        step_size: float = 0.1,
        max_iterations: int = 3000,
        goal_bias: float = 0.1,
        goal_tolerance: float = 0.05,
        workspace_margin: float = 0.3,
        segment_resolution: float = 0.02,
        rng: Optional[random.Random] = None,
    ) -> None:
        super().__init__(collision_checker)
        self.step_size = step_size
        self.max_iterations = max_iterations
        self.goal_bias = goal_bias
        self.goal_tolerance = goal_tolerance
        self.workspace_margin = workspace_margin
        self.segment_resolution = segment_resolution
        self._rng = rng or random.Random()

    def _workspace_bounds(self, start: Point, goal: Point):
        return [
            (min(s, g) - self.workspace_margin, max(s, g) + self.workspace_margin)
            for s, g in zip(start, goal)
        ]

    def _sample(self, bounds) -> Point:
        return tuple(self._rng.uniform(low, high) for low, high in bounds)

    def _nearest(self, nodes: Sequence[Point], point: Point) -> Point:
        return min(nodes, key=lambda node: _distance(node, point))

    def _steer(self, origin: Point, target: Point) -> Point:
        dist = _distance(origin, target)
        if dist <= self.step_size:
            return target
        ratio = self.step_size / dist
        return tuple(o + (t - o) * ratio for o, t in zip(origin, target))

    def _segment_free(self, a: Point, b: Point) -> bool:
        dist = _distance(a, b)
        steps = max(1, int(dist / self.segment_resolution))
        for step in range(1, steps + 1):
            t = step / steps
            point = tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
            if not self.collision_checker(point):
                return False
        return True

    def _build_path(self, parent: dict, end_node: Point, start: Point, goal: Point) -> list:
        path_nodes = []
        current = end_node
        while current is not None:
            path_nodes.append(current)
            current = parent[current]
        path_nodes.reverse()
        if end_node != goal:
            path_nodes.append(goal)
        return path_nodes

    def plan(self, start: Point, goal: Point, obstacles: Sequence[Obstacle]) -> PlanResult:
        started_at = time.perf_counter()

        if not self.collision_checker(start) or not self.collision_checker(goal):
            return PlanResult(
                success=False, elapsed_seconds=time.perf_counter() - started_at, algorithm=self.name
            )

        bounds = self._workspace_bounds(start, goal)
        nodes = [start]
        parent = {start: None}
        nodes_expanded = 0

        for _ in range(self.max_iterations):
            nodes_expanded += 1
            sample = goal if self._rng.random() < self.goal_bias else self._sample(bounds)
            nearest = self._nearest(nodes, sample)
            new_point = self._steer(nearest, sample)

            if new_point in parent:
                continue
            if not self.collision_checker(new_point) or not self._segment_free(nearest, new_point):
                continue

            nodes.append(new_point)
            parent[new_point] = nearest

            if _distance(new_point, goal) <= self.goal_tolerance:
                path = self._build_path(parent, new_point, start, goal)
                return PlanResult(
                    success=True,
                    path=path,
                    elapsed_seconds=time.perf_counter() - started_at,
                    nodes_expanded=nodes_expanded,
                    algorithm=self.name,
                )

        return PlanResult(
            success=False,
            path=[],
            elapsed_seconds=time.perf_counter() - started_at,
            nodes_expanded=nodes_expanded,
            algorithm=self.name,
        )
