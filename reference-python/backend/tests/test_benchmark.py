"""Karşılaştırma scripti testleri — Aşama 6."""

import json

from backend import benchmark


def test_run_benchmark_her_sahne_ve_algoritma_icin_metrik_uretir():
    results = benchmark.run_benchmark(runs_per_algorithm=1)

    assert set(results.keys()) == set(benchmark.SCENES.keys())
    for scene_results in results.values():
        assert set(scene_results.keys()) == set(benchmark.PLANNER_FACTORIES.keys())
        for metrics in scene_results.values():
            assert 0.0 <= metrics["success_rate"] <= 1.0
            assert metrics["avg_nodes_expanded"] >= 0
            if metrics["success_rate"] > 0:
                assert metrics["avg_elapsed_seconds"] is not None
                assert metrics["avg_path_length"] is not None


def test_save_results_json_dosyasina_yazar(tmp_path):
    results = {"az_engel": {"astar": {"success_rate": 1.0}}}
    output_path = tmp_path / "sonuc" / "benchmark.json"

    benchmark.save_results(results, path=str(output_path))

    assert output_path.exists()
    assert json.loads(output_path.read_text(encoding="utf-8")) == results
