"""Simülasyon ortamı testleri — Aşama 1."""

import pybullet as p
import pytest

from backend.planners.base import Obstacle
from backend.simulation import obstacles, scene


@pytest.fixture
def robot_id():
    scene.connect(gui=False)
    yield scene.load_robot()
    p.disconnect()


def test_connect_direct_mode_baglanti_kurar():
    client_id = scene.connect(gui=False)
    assert client_id >= 0
    p.disconnect()


def test_load_robot_yedi_eklem_dondurur(robot_id):
    assert p.getNumJoints(robot_id) == 7


def test_joint_info_yedi_donel_eklem_dondurur(robot_id):
    joints = scene.joint_info(robot_id)
    assert len(joints) == 7
    assert all(joint["type"] == "revolute" for joint in joints)
    assert all(joint["lower_limit"] < joint["upper_limit"] for joint in joints)


def test_end_effector_link_index_son_eklemi_dondurur(robot_id):
    assert scene.end_effector_link_index(robot_id) == 6


def test_add_obstacle_kure_body_id_dondurur(robot_id):
    sphere = Obstacle(center=(0.5, 0.0, 0.5), kind="sphere", size=(0.1,))
    body_id = obstacles.add_obstacle(sphere)
    assert body_id >= 0


def test_add_obstacle_kutu_body_id_dondurur(robot_id):
    box = Obstacle(center=(0.3, 0.3, 0.3), kind="box", size=(0.1, 0.1, 0.1))
    body_id = obstacles.add_obstacle(box)
    assert body_id >= 0


def test_add_obstacle_bilinmeyen_tip_hata_firlatir(robot_id):
    unknown = Obstacle(center=(0, 0, 0), kind="cone", size=(0.1,))
    with pytest.raises(ValueError):
        obstacles.add_obstacle(unknown)
