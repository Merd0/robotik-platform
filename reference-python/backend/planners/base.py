"""Tüm planlama algoritmalarının uyduğu ortak sözleşme.

Bu dosya projenin merkezi. A*, RRT, RRT* ve ileride eklenecek her algoritma
`Planner` sınıfından türer ve aynı `plan()` imzasını kullanır. Böylece
karşılaştırma kodu algoritmaların içini bilmek zorunda kalmaz.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Callable, Sequence

Point = tuple[float, float, float]


@dataclass(frozen=True)
class Obstacle:
    """Sahnedeki bir engel.

    kind: "sphere" veya "box"
    size: küre için (yarıçap,), kutu için (yarı_x, yarı_y, yarı_z)
    """

    center: Point
    kind: str
    size: tuple[float, ...]


@dataclass
class PlanResult:
    """Bir planlama denemesinin sonucu.

    Her algoritma bunu döndürür; karşılaştırma tablosu bu alanlardan üretilir.
    """

    success: bool
    path: list[Point] = field(default_factory=list)
    elapsed_seconds: float = 0.0
    nodes_expanded: int = 0
    algorithm: str = ""

    @property
    def path_length(self) -> float:
        """Yolun toplam öklid uzunluğu. Yol yoksa 0."""
        total = 0.0
        for a, b in zip(self.path, self.path[1:]):
            total += sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5
        return total

    def summary(self) -> dict:
        """Karşılaştırma tablosuna girecek tek satırlık özet."""
        return {
            "algorithm": self.algorithm,
            "success": self.success,
            "elapsed_seconds": round(self.elapsed_seconds, 4),
            "path_length": round(self.path_length, 4),
            "nodes_expanded": self.nodes_expanded,
            "waypoints": len(self.path),
        }


class Planner(ABC):
    """Planlama algoritmalarının temel sınıfı.

    collision_checker: bir noktanın güvenli olup olmadığını söyleyen fonksiyon.
    Aşama 3'te `simulation` katmanından gelir; planlayıcı engellerin geometrisini
    bilmek zorunda değil, sadece "bu nokta güvenli mi" diye sorar.
    """

    name: str = "base"

    def __init__(self, collision_checker: Callable[[Point], bool]) -> None:
        self.collision_checker = collision_checker

    @abstractmethod
    def plan(
        self,
        start: Point,
        goal: Point,
        obstacles: Sequence[Obstacle],
    ) -> PlanResult:
        """start'tan goal'e çarpışmasız bir yol bul.

        Başarısız olursa success=False ve boş path ile PlanResult döndür,
        exception fırlatma — karşılaştırma scripti başarısızlığı da ölçüyor.
        """
        raise NotImplementedError
