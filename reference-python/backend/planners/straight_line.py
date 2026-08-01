"""Basit düz çizgi planlayıcı — engelleri yok sayar.

`Planner` arayüzünün çalıştığını kanıtlamak için yazıldı; karşılaştırmaya
girmez, gerçek bir algoritma değildir.
"""

import time
from typing import Sequence

from backend.planners.base import Obstacle, PlanResult, Planner, Point


class StraightLinePlanner(Planner):
    """start'tan goal'e dogrudan dogru cizer, engelleri kontrol etmez."""

    name = "straight_line"

    def plan(
        self,
        start: Point,
        goal: Point,
        obstacles: Sequence[Obstacle],
    ) -> PlanResult:
        started_at = time.perf_counter()
        return PlanResult(
            success=True,
            path=[start, goal],
            elapsed_seconds=time.perf_counter() - started_at,
            nodes_expanded=2,
            algorithm=self.name,
        )
