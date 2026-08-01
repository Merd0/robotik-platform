"""Çarpışma kontrolü testleri — Aşama 3."""

import pytest

from backend.planners.base import Obstacle
from backend.simulation.obstacles import is_collision_free, is_path_segment_free

SPHERE = Obstacle(center=(0.0, 0.0, 0.0), kind="sphere", size=(0.5,))
BOX = Obstacle(center=(2.0, 0.0, 0.0), kind="box", size=(0.3, 0.3, 0.3))
OBSTACLES = [SPHERE, BOX]


@pytest.mark.parametrize(
    "point",
    [
        (0.0, 0.0, 0.0),  # kurenin merkezi
        (0.4, 0.0, 0.0),  # kure yaricapinin icinde
        (2.0, 0.0, 0.0),  # kutunun merkezi
        (2.2, 0.2, 0.2),  # kutunun icinde
    ],
)
def test_is_collision_free_carpisan_noktalari_reddeder(point):
    assert is_collision_free(point, OBSTACLES) is False


@pytest.mark.parametrize(
    "point",
    [
        (5.0, 5.0, 5.0),  # her iki engelden de uzak
        (0.6, 0.0, 0.0),  # kure yaricapinin hemen disinda
        (2.5, 0.0, 0.0),  # kutu yari kenarinin hemen disinda
    ],
)
def test_is_collision_free_serbest_noktalari_kabul_eder(point):
    assert is_collision_free(point, OBSTACLES) is True


def test_is_path_segment_free_engelden_gecen_yolu_reddeder():
    # Kurenin tam icinden gecen bir dogru parcasi.
    assert is_path_segment_free((-1.0, 0.0, 0.0), (1.0, 0.0, 0.0), OBSTACLES) is False


def test_is_path_segment_free_engeli_atlayan_yolu_kabul_eder():
    # Her iki engelden de uzak, guvenli bir dogru parcasi.
    assert is_path_segment_free((-1.0, 5.0, 0.0), (1.0, 5.0, 0.0), OBSTACLES) is True


def test_is_path_segment_free_ince_cozunurlukte_kucuk_engeli_yakalar():
    # Uc noktalar guvenli ama yolun tam ortasi kucuk bir engelin icinden geciyor;
    # sadece ara noktalari ornekleyen bir cozunurluk bunu yakalamali.
    tiny_obstacle = [Obstacle(center=(0.0, 3.0, 0.0), kind="sphere", size=(0.1,))]
    assert (
        is_path_segment_free((-1.0, 3.0, 0.0), (1.0, 3.0, 0.0), tiny_obstacle, resolution=0.05)
        is False
    )
