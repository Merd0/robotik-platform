"""Algoritma karşılaştırma scripti — projenin asıl çıktısı."""

import json
import random
import time
from pathlib import Path

from backend.planners.astar import AStarPlanner
from backend.planners.base import Obstacle
from backend.planners.rrt import RRTPlanner
from backend.planners.rrt_star import RRTStarPlanner
from backend.simulation.obstacles import is_collision_free

RUNS_PER_ALGORITHM = 5

# Uc zorluk seviyesi: az/orta/cok engel. start-goal her sahnede engellerin
# arasindan gecmeyi gerektirecek sekilde seciliyor.
SCENES = {
    "az_engel": {
        "start": (-0.6, 0.0, 0.3),
        "goal": (0.6, 0.0, 0.3),
        "obstacles": [
            Obstacle(center=(0.0, 0.3, 0.3), kind="sphere", size=(0.1,)),
        ],
    },
    "orta_engel": {
        "start": (-0.6, 0.25, 0.3),
        "goal": (0.6, -0.25, 0.3),
        "obstacles": [
            Obstacle(center=(0.0, -0.2, 0.3), kind="box", size=(0.05, 0.1, 0.4)),
            Obstacle(center=(0.0, 0.2, 0.3), kind="box", size=(0.05, 0.1, 0.4)),
            Obstacle(center=(-0.3, 0.0, 0.6), kind="sphere", size=(0.08,)),
        ],
    },
    "cok_engel": {
        "start": (-0.6, 0.3, 0.2),
        "goal": (0.6, -0.3, 0.4),
        "obstacles": [
            Obstacle(center=(-0.2, 0.15, 0.3), kind="sphere", size=(0.08,)),
            Obstacle(center=(0.0, -0.15, 0.3), kind="sphere", size=(0.08,)),
            Obstacle(center=(0.2, 0.1, 0.35), kind="sphere", size=(0.08,)),
            Obstacle(center=(-0.1, -0.05, 0.5), kind="box", size=(0.07, 0.07, 0.07)),
            Obstacle(center=(0.15, -0.25, 0.25), kind="box", size=(0.07, 0.07, 0.07)),
            Obstacle(center=(0.3, 0.2, 0.45), kind="sphere", size=(0.07,)),
        ],
    },
}

# RRT/RRT* icin tohum sadece kosular arasi farklilik saglar; algoritmayi
# degil sadece rastgele orneklemeyi belirler.
PLANNER_FACTORIES = {
    "astar": lambda checker, seed: AStarPlanner(checker, resolution=0.05, padding=0.3),
    "rrt": lambda checker, seed: RRTPlanner(
        checker, step_size=0.1, max_iterations=1500, goal_bias=0.1, rng=random.Random(seed)
    ),
    # RRT* rewire adimi O(n) komsu taramasi yaptigi icin RRT'den daha yavas;
    # 800 iterasyon test sahnelerinde %100 basari ve iyi yakinsama veriyor.
    "rrt_star": lambda checker, seed: RRTStarPlanner(
        checker,
        step_size=0.1,
        max_iterations=800,
        goal_bias=0.1,
        rewire_radius=0.2,
        rng=random.Random(seed),
    ),
}


def _average(values) -> float | None:
    values = list(values)
    return sum(values) / len(values) if values else None


def run_benchmark(runs_per_algorithm: int = RUNS_PER_ALGORITHM) -> dict:
    """Her sahnede her algoritmayi N kez calistirip metrikleri toplar."""
    results = {}

    for scene_name, scene in SCENES.items():
        results[scene_name] = {}
        checker = lambda point, obstacles=scene["obstacles"]: is_collision_free(point, obstacles)

        for algo_name, factory in PLANNER_FACTORIES.items():
            runs = []
            for seed in range(runs_per_algorithm):
                planner = factory(checker, seed)
                runs.append(planner.plan(scene["start"], scene["goal"], scene["obstacles"]))

            successes = [r for r in runs if r.success]
            results[scene_name][algo_name] = {
                "runs": runs_per_algorithm,
                "success_rate": len(successes) / len(runs),
                "avg_elapsed_seconds": _average(r.elapsed_seconds for r in successes),
                "avg_path_length": _average(r.path_length for r in successes),
                "avg_nodes_expanded": _average(r.nodes_expanded for r in runs),
            }

    return results


def print_table(results: dict) -> None:
    header = f"{'sahne':<12}{'algoritma':<10}{'basari':>8}{'sure(s)':>10}{'yol_uzunlugu':>14}{'dugum':>10}"
    print(header)
    print("-" * len(header))
    for scene_name, algorithms in results.items():
        for algo_name, metrics in algorithms.items():
            success_rate = f"{metrics['success_rate'] * 100:.0f}%"
            avg_time = (
                f"{metrics['avg_elapsed_seconds']:.4f}"
                if metrics["avg_elapsed_seconds"] is not None
                else "-"
            )
            avg_length = (
                f"{metrics['avg_path_length']:.3f}" if metrics["avg_path_length"] is not None else "-"
            )
            avg_nodes = f"{metrics['avg_nodes_expanded']:.0f}"
            print(
                f"{scene_name:<12}{algo_name:<10}{success_rate:>8}{avg_time:>10}"
                f"{avg_length:>14}{avg_nodes:>10}"
            )


def save_results(results: dict, path: str = "results/benchmark.json") -> None:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    results = run_benchmark()
    print_table(results)
    save_results(results)


if __name__ == "__main__":
    main()
