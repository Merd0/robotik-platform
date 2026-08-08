"""Planlayıcı testleri — Aşama 4 ve 5."""

import random

import pytest

from backend.planners.astar import AStarPlanner
from backend.planners.base import Obstacle
from backend.planners.rrt import RRTPlanner
from backend.planners.rrt_star import RRTStarPlanner, _propagate_descendant_costs
from backend.planners.straight_line import StraightLinePlanner
from backend.simulation.obstacles import is_collision_free, is_path_segment_free

START = (0.0, 0.0, 0.0)
GOAL = (1.0, 1.0, 1.0)


def _always_free(point):
    return True


def test_straight_line_planner_basarili_sonuc_doner():
    planner = StraightLinePlanner(collision_checker=_always_free)

    result = planner.plan(START, GOAL, obstacles=[])

    assert result.success is True
    assert result.path == [START, GOAL]
    assert result.algorithm == "straight_line"


def test_straight_line_planner_engelleri_yok_sayar():
    planner = StraightLinePlanner(collision_checker=_always_free)
    obstacle_on_path = [Obstacle(center=(0.5, 0.5, 0.5), kind="sphere", size=(0.1,))]

    result = planner.plan(START, GOAL, obstacles=obstacle_on_path)

    assert result.success is True
    assert result.path == [START, GOAL]


def test_plan_result_summary_karsilastirma_alanlarini_icerir():
    planner = StraightLinePlanner(collision_checker=_always_free)

    result = planner.plan(START, GOAL, obstacles=[])
    summary = result.summary()

    assert summary["algorithm"] == "straight_line"
    assert summary["success"] is True
    assert summary["waypoints"] == 2
    assert summary["path_length"] == pytest.approx(3**0.5, abs=1e-4)


# Bilinen labirent: x=0 duzleminde, y=0 civarinda dar bir gecit birakan iki
# kutudan olusan bir duvar. Baslangic ve hedef gecidin karsi taraflarinda,
# farkli y degerlerinde; yol sadece gecitten gecerek ulasabilir.
MAZE_WALL = [
    Obstacle(center=(0.0, -0.2, 0.0), kind="box", size=(0.05, 0.1, 0.4)),
    Obstacle(center=(0.0, 0.2, 0.0), kind="box", size=(0.05, 0.1, 0.4)),
]
MAZE_START = (-0.5, 0.25, 0.0)
MAZE_GOAL = (0.5, -0.25, 0.0)


def _maze_checker(point):
    return is_collision_free(point, MAZE_WALL)


def test_astar_planner_bilinen_labirentte_dogru_yolu_bulur():
    planner = AStarPlanner(_maze_checker, resolution=0.1, padding=0.35)

    result = planner.plan(MAZE_START, MAZE_GOAL, MAZE_WALL)

    assert result.success is True
    assert result.path[0] == MAZE_START
    assert result.path[-1] == MAZE_GOAL
    # Yol gecidi kullanmis olmali: bir noktasi acikligin (|y|<0.1) icinden gecmeli.
    assert any(abs(point[1]) < 0.1 for point in result.path)
    for a, b in zip(result.path, result.path[1:]):
        assert is_path_segment_free(a, b, MAZE_WALL, resolution=0.01)


def test_astar_planner_baslangic_engelin_icindeyse_basarisiz_doner():
    planner = AStarPlanner(_maze_checker, resolution=0.1, padding=0.35)

    result = planner.plan((0.0, -0.2, 0.0), MAZE_GOAL, MAZE_WALL)

    assert result.success is False
    assert result.path == []


def test_rrt_planner_cozum_bulur_ve_yol_carpismasizdir():
    planner = RRTPlanner(
        _maze_checker, step_size=0.1, max_iterations=3000, goal_bias=0.1, rng=random.Random(0)
    )

    result = planner.plan(MAZE_START, MAZE_GOAL, MAZE_WALL)

    assert result.success is True
    assert result.path[0] == MAZE_START
    assert result.path[-1] == MAZE_GOAL
    for a, b in zip(result.path, result.path[1:]):
        assert is_path_segment_free(a, b, MAZE_WALL, resolution=0.01)


def test_rrt_star_planner_ayni_sahnede_rrt_den_daha_kisa_yol_uretir():
    open_checker = lambda point: is_collision_free(point, [])
    start, goal = (0.0, 0.0, 0.0), (1.0, 1.0, 0.5)

    rrt = RRTPlanner(
        open_checker, step_size=0.1, max_iterations=3000, goal_bias=0.1, rng=random.Random(0)
    )
    rrt_result = rrt.plan(start, goal, [])

    rrt_star = RRTStarPlanner(
        open_checker,
        step_size=0.1,
        max_iterations=3000,
        goal_bias=0.1,
        rewire_radius=0.2,
        rng=random.Random(0),
    )
    rrt_star_result = rrt_star.plan(start, goal, [])

    assert rrt_result.success is True
    assert rrt_star_result.success is True
    assert rrt_star_result.path_length < rrt_result.path_length


def test_rrt_star_rewire_maliyetini_tum_alt_agaca_tasir():
    root, child, grandchild = (0, 0, 0), (1, 0, 0), (2, 0, 0)
    children = {root: {child}, child: {grandchild}, grandchild: set()}
    cost = {root: 4.0, child: 5.0, grandchild: 6.0}

    _propagate_descendant_costs(root, -2.0, children, cost)

    assert cost == {root: 2.0, child: 3.0, grandchild: 4.0}
