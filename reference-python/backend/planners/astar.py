"""A* — grid tabanlı yol arama."""

import heapq
import itertools
import time
from typing import Sequence

from backend.planners.base import Obstacle, PlanResult, Planner, Point

_NEIGHBOR_OFFSETS = [
    offset for offset in itertools.product((-1, 0, 1), repeat=3) if offset != (0, 0, 0)
]


class AStarPlanner(Planner):
    """Sabit çözünürlüklü 3B grid üzerinde A* ile yol arar."""

    name = "astar"

    def __init__(
        self,
        collision_checker,
        resolution: float = 0.05,
        padding: float = 0.2,
        max_expansions: int = 50000,
    ) -> None:
        super().__init__(collision_checker)
        self.resolution = resolution
        self.padding = padding
        self.max_expansions = max_expansions

    def _to_cell(self, point: Point) -> tuple:
        return tuple(round(coord / self.resolution) for coord in point)

    def _to_point(self, cell: tuple) -> Point:
        return tuple(index * self.resolution for index in cell)

    def _heuristic(self, cell: tuple, goal_cell: tuple) -> float:
        return sum((a - b) ** 2 for a, b in zip(cell, goal_cell)) ** 0.5 * self.resolution

    def plan(self, start: Point, goal: Point, obstacles: Sequence[Obstacle]) -> PlanResult:
        started_at = time.perf_counter()

        if not self.collision_checker(start) or not self.collision_checker(goal):
            return PlanResult(
                success=False, elapsed_seconds=time.perf_counter() - started_at, algorithm=self.name
            )

        start_cell = self._to_cell(start)
        goal_cell = self._to_cell(goal)
        padding_cells = max(1, round(self.padding / self.resolution))
        bounds = [
            (min(s, g) - padding_cells, max(s, g) + padding_cells)
            for s, g in zip(start_cell, goal_cell)
        ]

        def in_bounds(cell: tuple) -> bool:
            return all(low <= c <= high for c, (low, high) in zip(cell, bounds))

        open_heap = [(self._heuristic(start_cell, goal_cell), 0.0, start_cell)]
        came_from: dict = {}
        cost_so_far = {start_cell: 0.0}
        visited = set()
        nodes_expanded = 0

        while open_heap and nodes_expanded < self.max_expansions:
            _, cost, current = heapq.heappop(open_heap)
            if current in visited:
                continue
            visited.add(current)
            nodes_expanded += 1

            if current == goal_cell:
                path_cells = [current]
                while current in came_from:
                    current = came_from[current]
                    path_cells.append(current)
                path_cells.reverse()
                path = [start] + [self._to_point(c) for c in path_cells[1:-1]] + [goal]
                return PlanResult(
                    success=True,
                    path=path,
                    elapsed_seconds=time.perf_counter() - started_at,
                    nodes_expanded=nodes_expanded,
                    algorithm=self.name,
                )

            for offset in _NEIGHBOR_OFFSETS:
                neighbor = tuple(c + o for c, o in zip(current, offset))
                if neighbor in visited or not in_bounds(neighbor):
                    continue
                if not self.collision_checker(self._to_point(neighbor)):
                    continue
                step_cost = sum(o ** 2 for o in offset) ** 0.5 * self.resolution
                new_cost = cost_so_far[current] + step_cost
                if neighbor not in cost_so_far or new_cost < cost_so_far[neighbor]:
                    cost_so_far[neighbor] = new_cost
                    priority = new_cost + self._heuristic(neighbor, goal_cell)
                    heapq.heappush(open_heap, (priority, new_cost, neighbor))
                    came_from[neighbor] = current

        return PlanResult(
            success=False,
            path=[],
            elapsed_seconds=time.perf_counter() - started_at,
            nodes_expanded=nodes_expanded,
            algorithm=self.name,
        )
