"""API testleri — Aşama 7."""

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app

client = TestClient(app)


def test_get_algorithms_uc_algoritmayi_listeler():
    response = client.get("/algorithms")

    assert response.status_code == 200
    assert set(response.json()) == {"astar", "rrt", "rrt_star"}


@pytest.mark.parametrize("algorithm", ["astar", "rrt", "rrt_star"])
def test_post_plan_gecerli_sonuc_doner(algorithm):
    response = client.post(
        "/plan",
        json={
            "start": [-0.5, 0.0, 0.3],
            "goal": [0.5, 0.0, 0.3],
            "obstacles": [],
            "algorithm": algorithm,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["algorithm"] == algorithm
    assert body["path"][0] == pytest.approx([-0.5, 0.0, 0.3])
    assert body["path"][-1] == pytest.approx([0.5, 0.0, 0.3])
    assert body["waypoints"] == len(body["path"])


def test_post_plan_engelli_govde_ile_calisir():
    response = client.post(
        "/plan",
        json={
            "start": [-0.5, 0.0, 0.3],
            "goal": [0.5, 0.0, 0.3],
            "obstacles": [{"center": [0.0, 0.5, 0.3], "kind": "sphere", "size": [0.1]}],
            "algorithm": "astar",
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True


def test_post_plan_bilinmeyen_algoritma_400_doner():
    response = client.post(
        "/plan",
        json={"start": [0, 0, 0], "goal": [1, 1, 1], "obstacles": [], "algorithm": "yok_boyle_bir_sey"},
    )

    assert response.status_code == 400
