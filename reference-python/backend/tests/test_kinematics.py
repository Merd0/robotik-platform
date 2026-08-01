"""Kinematik testleri — Aşama 2."""

import pybullet as p
import pytest

from backend.kinematics import inverse as inverse_module
from backend.kinematics.forward import forward_kinematics
from backend.kinematics.inverse import inverse_kinematics
from backend.simulation import scene

# Eklem limitleri icinde, birbirinden farkli 5 poz.
JOINT_ANGLE_CASES = [
    (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
    (0.5, -0.3, 0.2, 0.8, -0.5, 0.4, 0.1),
    (-1.0, 0.6, -0.4, 1.2, 0.3, -0.7, 0.9),
    (1.5, -1.0, 0.7, -0.5, 1.1, -0.2, 0.6),
    (-0.8, 0.9, -1.2, 0.4, -0.6, 1.0, -0.3),
]

REACHABLE_TARGETS = [
    (0.4, 0.2, 0.6),
    (0.3, -0.3, 0.5),
    (0.5, 0.0, 0.7),
]


@pytest.fixture
def robot_id():
    scene.connect(gui=False)
    yield scene.load_robot()
    p.disconnect()


@pytest.mark.parametrize("joint_angles", JOINT_ANGLE_CASES)
def test_forward_kinematics_pybullet_ile_eslesir(robot_id, joint_angles):
    computed = forward_kinematics(robot_id, joint_angles)

    for joint_index, angle in enumerate(joint_angles):
        p.resetJointState(robot_id, joint_index, angle)
    link_index = scene.end_effector_link_index(robot_id)
    expected = p.getLinkState(robot_id, link_index, computeForwardKinematics=True)[4]

    for actual, wanted in zip(computed, expected):
        assert actual == pytest.approx(wanted, abs=1e-9)


@pytest.mark.parametrize("target", REACHABLE_TARGETS)
def test_inverse_kinematics_hedefe_ulasir(robot_id, target):
    solution = inverse_kinematics(robot_id, target)

    assert solution is not None
    reached = forward_kinematics(robot_id, solution)
    error = sum((a - b) ** 2 for a, b in zip(reached, target)) ** 0.5
    assert error < 0.01


def test_inverse_kinematics_eklem_limitleri_disini_reddeder(robot_id, monkeypatch):
    # PyBullet'in coguzucusu zaten URDF limitlerine yakin sonuclar uretiyor,
    # bu yuzden limit disi bir cozumu dogrudan sahteleyerek reddi test ediyoruz.
    out_of_range_angles = [10.0] * 7
    monkeypatch.setattr(
        inverse_module.p, "calculateInverseKinematics", lambda *args, **kwargs: out_of_range_angles
    )

    solution = inverse_kinematics(robot_id, (0.4, 0.2, 0.6))

    assert solution is None
