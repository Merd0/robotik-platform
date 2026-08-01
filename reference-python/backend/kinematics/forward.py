"""Forward kinematics: eklem açıları -> uç nokta konumu."""

from typing import Sequence

import pybullet as p

from backend.planners.base import Point
from backend.simulation.scene import end_effector_link_index


def forward_kinematics(robot_id: int, joint_angles: Sequence[float]) -> Point:
    """Verilen eklem acilarinda uc noktanin (end effector) dunya konumunu hesaplar."""
    for joint_index, angle in enumerate(joint_angles):
        p.resetJointState(robot_id, joint_index, angle)

    link_index = end_effector_link_index(robot_id)
    link_state = p.getLinkState(robot_id, link_index, computeForwardKinematics=True)
    # index 4 (worldLinkFramePosition): calculateInverseKinematics hedefleri de
    # bu cerceveye gore yorumluyor; index 0 kutle merkezi (COM) olup eslesmiyor.
    return link_state[4]
