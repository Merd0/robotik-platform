"""Inverse kinematics: hedef konum -> eklem açıları."""

import pybullet as p

from backend.planners.base import Point
from backend.simulation.scene import end_effector_link_index, joint_info


def inverse_kinematics(robot_id: int, target: Point) -> list[float] | None:
    """Hedef konuma ulasan eklem acilarini hesaplar.

    Cozum eklem limitleri disindaysa None doner.
    """
    angles = p.calculateInverseKinematics(
        robot_id,
        end_effector_link_index(robot_id),
        target,
        maxNumIterations=200,
        residualThreshold=1e-5,
    )

    for angle, joint in zip(angles, joint_info(robot_id)):
        if not (joint["lower_limit"] <= angle <= joint["upper_limit"]):
            return None

    return list(angles)
