import type { Vec3 } from "../transform";
import type { CollisionChecker, PlanResult, Planner } from "./base";

/** Grid hücresi: [x, y, z] tamsayı indeksleri. */
type Cell = readonly [number, number, number];

function cellKey(cell: Cell): string {
  return `${cell[0]},${cell[1]},${cell[2]}`;
}

function cellCompare(a: Cell, b: Cell): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

const NEIGHBOR_OFFSETS: Cell[] = (() => {
  const offsets: Cell[] = [];
  for (const dx of [-1, 0, 1]) {
    for (const dy of [-1, 0, 1]) {
      for (const dz of [-1, 0, 1]) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        offsets.push([dx, dy, dz]);
      }
    }
  }
  return offsets;
})();

interface HeapEntry {
  priority: number;
  cost: number;
  cell: Cell;
}

/**
 * Basit binary min-heap. Python'daki heapq'nin (priority, cost, cell) tuple
 * sıralamasıyla birebir eşleşsin diye üç seviyeli karşılaştırma yapar —
 * bu, eşit öncelikli komşuların çok olduğu simetrik ızgaralarda Python
 * fixture'ıyla aynı düğüm genişletme sırasını (ve sayısını) üretmek için
 * gerekli.
 */
class MinHeap {
  private items: HeapEntry[] = [];

  get size() {
    return this.items.length;
  }

  push(entry: HeapEntry) {
    this.items.push(entry);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): HeapEntry | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private less(a: HeapEntry, b: HeapEntry): boolean {
    if (a.priority !== b.priority) return a.priority < b.priority;
    if (a.cost !== b.cost) return a.cost < b.cost;
    return cellCompare(a.cell, b.cell) < 0;
  }

  private bubbleUp(index: number) {
    let i = index;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(this.items[i], this.items[parent])) break;
      [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
      i = parent;
    }
  }

  private bubbleDown(index: number) {
    let i = index;
    const n = this.items.length;
    for (;;) {
      const left = i * 2 + 1;
      const right = i * 2 + 2;
      let smallest = i;
      if (left < n && this.less(this.items[left], this.items[smallest])) smallest = left;
      if (right < n && this.less(this.items[right], this.items[smallest])) smallest = right;
      if (smallest === i) break;
      [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]];
      i = smallest;
    }
  }
}

export interface AStarOptions {
  /** Izgara hücre boyutu (metre). */
  resolution?: number;
  /** Arama sınırlarını start/goal kutusunun dışına genişletme payı (metre). */
  padding?: number;
  maxExpansions?: number;
  /**
   * Düzlemsel arama: z ekseninde hiç hareket edilmez.
   *
   * 2B sahnelerde (PlannerRace üstten görünüm) planlayıcı 3B aradığı için
   * yol, kullanıcının göremediği z ekseninden dolaşıp engeli "delmiş" gibi
   * görünüyordu. Bkz. RrtOptions.planar.
   */
  planar?: boolean;
}

/**
 * A* — sabit çözünürlüklü 3B grid üzerinde arama.
 * reference-python/backend/planners/astar.py'nin TS portu (bkz. docs/02).
 */
export class AStarPlanner implements Planner {
  name = "astar";
  private resolution: number;
  private padding: number;
  private maxExpansions: number;
  private planar: boolean;

  constructor(options: AStarOptions = {}) {
    this.resolution = options.resolution ?? 0.05;
    this.padding = options.padding ?? 0.2;
    this.maxExpansions = options.maxExpansions ?? 50000;
    this.planar = options.planar ?? false;
  }

  private toCell(point: Vec3): Cell {
    return [
      Math.round(point.x / this.resolution),
      Math.round(point.y / this.resolution),
      Math.round(point.z / this.resolution),
    ];
  }

  private toPoint(cell: Cell): Vec3 {
    return { x: cell[0] * this.resolution, y: cell[1] * this.resolution, z: cell[2] * this.resolution };
  }

  /**
   * Çapraz hamlenin geçtiği ara hücreler de serbest mi.
   *
   * Yalnızca hedef hücreyi kontrol etmek yetmez: iki dolu hücre köşegen
   * komşuysa, aradaki boşluktan geçen hamle geometrik olarak engelin
   * içinden geçer (corner cutting). Her eksen bileşenini tek başına
   * uygulayıp o ara hücrenin de serbest olmasını şart koşuyoruz.
   * reference-python/backend/planners/astar.py `_diagonal_allowed` ile aynı.
   */
  private diagonalAllowed(cell: Cell, offset: Cell, isFree: CollisionChecker): boolean {
    for (let axis = 0; axis < 3; axis++) {
      if (offset[axis] === 0) continue;
      const between: Cell = [
        cell[0] + (axis === 0 ? offset[0] : 0),
        cell[1] + (axis === 1 ? offset[1] : 0),
        cell[2] + (axis === 2 ? offset[2] : 0),
      ];
      if (!isFree(this.toPoint(between))) return false;
    }
    return true;
  }

  /**
   * İki nokta arasındaki doğru parçası serbest mi.
   *
   * A* yalnızca hücre MERKEZLERİNİ test ediyordu; ızgara çözünürlüğünden
   * ince bir engel iki merkez arasına sığdığında görünmez oluyor ve yol
   * engelin içinden geçiyordu. Kenarları ve start/goal bağlantılarını
   * çözünürlüğün yarısı adımla örnekliyoruz.
   */
  private segmentFree(a: Vec3, b: Vec3, isFree: CollisionChecker): boolean {
    const dist = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    const steps = Math.max(1, Math.ceil(dist / (this.resolution / 2)));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const point: Vec3 = {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
      };
      if (!isFree(point)) return false;
    }
    return true;
  }

  private heuristic(cell: Cell, goalCell: Cell): number {
    const dx = cell[0] - goalCell[0];
    const dy = cell[1] - goalCell[1];
    const dz = cell[2] - goalCell[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz) * this.resolution;
  }

  plan(start: Vec3, goal: Vec3, isFree: CollisionChecker): PlanResult {
    const startedAt = Date.now();

    if (!isFree(start) || !isFree(goal)) {
      return { success: false, path: [], elapsedMs: Date.now() - startedAt, nodesExpanded: 0, algorithm: this.name };
    }

    const startCell = this.toCell(start);
    const goalCell = this.toCell(goal);
    const goalKey = cellKey(goalCell);
    const paddingCells = Math.max(1, Math.round(this.padding / this.resolution));
    const bounds = [0, 1, 2].map((axis) => {
      const low = Math.min(startCell[axis], goalCell[axis]) - paddingCells;
      const high = Math.max(startCell[axis], goalCell[axis]) + paddingCells;
      return [low, high] as const;
    });
    const inBounds = (cell: Cell) => cell.every((c, axis) => c >= bounds[axis][0] && c <= bounds[axis][1]);

    const open = new MinHeap();
    open.push({ priority: this.heuristic(startCell, goalCell), cost: 0, cell: startCell });
    const cameFrom = new Map<string, Cell>();
    const costSoFar = new Map<string, number>([[cellKey(startCell), 0]]);
    const visited = new Set<string>();
    let nodesExpanded = 0;

    while (open.size > 0 && nodesExpanded < this.maxExpansions) {
      const entry = open.pop()!;
      const currentKey = cellKey(entry.cell);
      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      nodesExpanded++;

      if (currentKey === goalKey) {
        const cells: Cell[] = [entry.cell];
        let cursor = currentKey;
        while (cameFrom.has(cursor)) {
          const prev = cameFrom.get(cursor)!;
          cells.push(prev);
          cursor = cellKey(prev);
        }
        cells.reverse();
        // Yol, ilk ve son hücre merkezi yerine tam start/goal ile kapanıyor.
        // Bu iki bağlantı segmenti ızgarada hiç yer almadığı için ayrıca
        // kontrol edilmeli — aksi hâlde aralarında duran bir engel
        // görülmeden "başarılı" bir yol dönebilir.
        const path: Vec3[] = [start, ...cells.slice(1, -1).map((c) => this.toPoint(c)), goal];
        for (let i = 1; i < path.length; i++) {
          if (!this.segmentFree(path[i - 1], path[i], isFree)) {
            return {
              success: false,
              path: [],
              elapsedMs: Date.now() - startedAt,
              nodesExpanded,
              algorithm: this.name,
            };
          }
        }
        return { success: true, path, elapsedMs: Date.now() - startedAt, nodesExpanded, algorithm: this.name };
      }

      const offsets = this.planar
        ? NEIGHBOR_OFFSETS.filter((offset) => offset[2] === 0)
        : NEIGHBOR_OFFSETS;

      for (const offset of offsets) {
        const neighbor: Cell = [
          entry.cell[0] + offset[0],
          entry.cell[1] + offset[1],
          entry.cell[2] + offset[2],
        ];
        const neighborKey = cellKey(neighbor);
        if (visited.has(neighborKey) || !inBounds(neighbor)) continue;
        if (!isFree(this.toPoint(neighbor))) continue;
        if (!this.diagonalAllowed(entry.cell, offset, isFree)) continue;
        if (!this.segmentFree(this.toPoint(entry.cell), this.toPoint(neighbor), isFree)) continue;

        const stepCost = Math.sqrt(offset[0] ** 2 + offset[1] ** 2 + offset[2] ** 2) * this.resolution;
        const newCost = (costSoFar.get(currentKey) ?? 0) + stepCost;
        const existingCost = costSoFar.get(neighborKey);
        if (existingCost === undefined || newCost < existingCost) {
          costSoFar.set(neighborKey, newCost);
          open.push({ priority: newCost + this.heuristic(neighbor, goalCell), cost: newCost, cell: neighbor });
          cameFrom.set(neighborKey, entry.cell);
        }
      }
    }

    return { success: false, path: [], elapsedMs: Date.now() - startedAt, nodesExpanded, algorithm: this.name };
  }
}
