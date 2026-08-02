"""A* icin capraz dogrulama fixture'i uretir (pybullet bagimliligi olmadan).

lib/robotics/planners/astar.ts, reference-python/backend/planners/astar.py'nin
TS portu (bkz. docs/02-mimari.md). Bu script backend.planners.astar'i
DOGRUDAN calistirir (pybullet gerektirmez, sadece backend.simulation.obstacles
pybullet'e bagimli, o modulu import etmiyoruz) ve TS tarafinin birebir
uretmesi gereken path/nodesExpanded degerlerini JSON'a yazar.

A* deterministiktir (RNG yok) ve TS tarafindaki MinHeap, Python heapq'nin
(priority, cost, cell) tuple sira karsilastirmasiyla birebir eslesecek
sekilde yazildi (bkz. lib/robotics/planners/astar.ts yorumu) -- bu yuzden
path VE nodesExpanded tam olarak karsilastirilabilir (tolerans 1e-9).
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.planners.astar import AStarPlanner  # noqa: E402


def point_free(point, obstacles):
    """collision.ts'teki isPointFree ile birebir ayni mantik (pybullet'siz)."""
    for obstacle in obstacles:
        kind = obstacle["kind"]
        center = obstacle["center"]
        size = obstacle["size"]
        if kind == "sphere":
            radius = size[0]
            dist = sum((p - c) ** 2 for p, c in zip(point, center)) ** 0.5
            if dist <= radius:
                return False
        elif kind == "box":
            half = size
            if all(abs(p - c) <= h for p, c, h in zip(point, center, half)):
                return False
    return True


def run_case(name, start, goal, obstacles, **planner_kwargs):
    checker = lambda point: point_free(point, obstacles)  # noqa: E731
    planner = AStarPlanner(checker, **planner_kwargs)
    result = planner.plan(start, goal, [])
    return {
        "name": name,
        "start": list(start),
        "goal": list(goal),
        "obstacles": obstacles,
        "options": {
            "resolution": planner.resolution,
            "padding": planner.padding,
            "maxExpansions": planner.max_expansions,
        },
        "expected": {
            "success": result.success,
            "path": [list(p) for p in result.path],
            "nodesExpanded": result.nodes_expanded,
            "algorithm": result.algorithm,
        },
    }


def main():
    cases = [
        run_case(
            "acik-alan",
            (0.0, 0.0, 0.0),
            (0.3, 0.0, 0.0),
            [],
        ),
        run_case(
            "kutu-etrafindan-dolan",
            (0.0, 0.0, 0.0),
            (0.4, 0.0, 0.0),
            [{"kind": "box", "center": [0.2, 0.0, 0.0], "size": [0.05, 0.15, 0.15]}],
        ),
        run_case(
            "hedef-engelin-icinde",
            (0.0, 0.0, 0.0),
            (0.2, 0.0, 0.0),
            [{"kind": "sphere", "center": [0.2, 0.0, 0.0], "size": [0.1]}],
        ),
        run_case(
            "kure-etrafindan-dolan",
            (0.0, 0.0, 0.0),
            (0.3, 0.0, 0.0),
            [{"kind": "sphere", "center": [0.15, 0.0, 0.0], "size": [0.08]}],
            resolution=0.05,
            padding=0.15,
        ),
    ]

    fixture = {"tolerance": 1e-9, "cases": cases}
    output_path = Path(__file__).resolve().parent.parent / "fixtures" / "astar-planner.json"
    output_path.write_text(json.dumps(fixture, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"{len(cases)} A* fixture'i uretildi: {output_path}")


if __name__ == "__main__":
    main()
