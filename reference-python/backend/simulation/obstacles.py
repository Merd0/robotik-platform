"""Engellerin sahneye eklenmesi ve çarpışma kontrolü."""

from typing import Sequence

import pybullet as p

from backend.planners.base import Obstacle, Point


def add_obstacle(obstacle: Obstacle) -> int:
    """Kure veya kutu engelini PyBullet sahnesine ekler, body_id doner."""
    if obstacle.kind == "sphere":
        (radius,) = obstacle.size
        collision_shape = p.createCollisionShape(p.GEOM_SPHERE, radius=radius)
        visual_shape = p.createVisualShape(p.GEOM_SPHERE, radius=radius)
    elif obstacle.kind == "box":
        collision_shape = p.createCollisionShape(p.GEOM_BOX, halfExtents=obstacle.size)
        visual_shape = p.createVisualShape(p.GEOM_BOX, halfExtents=obstacle.size)
    else:
        raise ValueError(f"Bilinmeyen engel tipi: {obstacle.kind}")

    return p.createMultiBody(
        baseMass=0,
        baseCollisionShapeIndex=collision_shape,
        baseVisualShapeIndex=visual_shape,
        basePosition=obstacle.center,
    )


def _point_in_obstacle(point: Point, obstacle: Obstacle) -> bool:
    if obstacle.kind == "sphere":
        (radius,) = obstacle.size
        distance = sum((p - c) ** 2 for p, c in zip(point, obstacle.center)) ** 0.5
        return distance <= radius
    if obstacle.kind == "box":
        return all(
            abs(p - c) <= half
            for p, c, half in zip(point, obstacle.center, obstacle.size)
        )
    raise ValueError(f"Bilinmeyen engel tipi: {obstacle.kind}")


def is_collision_free(point: Point, obstacles: Sequence[Obstacle]) -> bool:
    """Verilen 3B nokta hicbir engelin icinde degilse True doner."""
    return not any(_point_in_obstacle(point, obstacle) for obstacle in obstacles)


def is_path_segment_free(
    a: Point, b: Point, obstacles: Sequence[Obstacle], resolution: float = 0.05
) -> bool:
    """a ve b arasindaki dogru parcasini ornekleyip her ornegin guvenli olup olmadigini kontrol eder."""
    distance = sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5
    steps = max(1, int(distance / resolution))

    for step in range(steps + 1):
        t = step / steps
        point = tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
        if not is_collision_free(point, obstacles):
            return False

    return True
