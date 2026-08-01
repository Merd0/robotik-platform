"""FastAPI uygulaması."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.planners.astar import AStarPlanner
from backend.planners.base import Obstacle
from backend.planners.rrt import RRTPlanner
from backend.planners.rrt_star import RRTStarPlanner
from backend.simulation.obstacles import is_collision_free

app = FastAPI(title="Robot Arm Path Planner API")

# Gelistirme asamasinda frontend hangi porttan sunulacagi henuz sabit degil
# (statik dosya sunucusu / farkli portlar denenebilir); kimlik dogrulama
# olmadigi icin tum originlere izin vermek bu asamada risksiz.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ObstacleModel(BaseModel):
    center: tuple[float, float, float]
    kind: str
    size: tuple[float, ...]


class PlanRequest(BaseModel):
    start: tuple[float, float, float]
    goal: tuple[float, float, float]
    obstacles: list[ObstacleModel] = []
    algorithm: str


class PlanResponse(BaseModel):
    success: bool
    algorithm: str
    elapsed_seconds: float
    path_length: float
    nodes_expanded: int
    waypoints: int
    path: list[tuple[float, float, float]]


PLANNER_FACTORIES = {
    "astar": lambda checker: AStarPlanner(checker, resolution=0.05, padding=0.3),
    "rrt": lambda checker: RRTPlanner(checker, step_size=0.1, max_iterations=1500, goal_bias=0.1),
    "rrt_star": lambda checker: RRTStarPlanner(
        checker, step_size=0.1, max_iterations=800, goal_bias=0.1, rewire_radius=0.2
    ),
}


@app.get("/algorithms")
def list_algorithms() -> list[str]:
    """Mevcut algoritma adlarini dondurur."""
    return list(PLANNER_FACTORIES.keys())


@app.post("/plan", response_model=PlanResponse)
def create_plan(request: PlanRequest) -> PlanResponse:
    """start'tan goal'e verilen algoritma ile bir yol planlar."""
    if request.algorithm not in PLANNER_FACTORIES:
        raise HTTPException(status_code=400, detail=f"Bilinmeyen algoritma: {request.algorithm}")

    obstacles = [
        Obstacle(center=obstacle.center, kind=obstacle.kind, size=obstacle.size)
        for obstacle in request.obstacles
    ]
    checker = lambda point: is_collision_free(point, obstacles)
    planner = PLANNER_FACTORIES[request.algorithm](checker)

    result = planner.plan(request.start, request.goal, obstacles)

    return PlanResponse(path=result.path, **result.summary())
