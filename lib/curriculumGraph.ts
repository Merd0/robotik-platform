import type { Seviye } from "./content";

/**
 * "Kavram Haritası" (FAZ 6 — kendi fikir, docs/16 Madde 41'in işaret ettiği
 * boşluğa karşılık): var olan `onkosul` verisinden gerçek bir düğüm-kenar
 * grafiği çıkaran saf yerleşim (layout) fonksiyonu. Yeni bir ilişki icat
 * etmez — `scripts/validate-content-graph.ts`in zaten doğruladığı aynı
 * grafiği (hat sütun, seviye satır olacak şekilde) konumlandırır.
 */

export interface CurriculumLessonInput {
  id: string;
  baslik: string;
  hat: string;
  seviye: Seviye;
  onkosul: readonly string[];
}

export interface CurriculumNode {
  id: string;
  baslik: string;
  hat: string;
  seviye: Seviye;
  x: number;
  y: number;
}

export interface CurriculumEdge {
  fromId: string;
  toId: string;
  crossHat: boolean;
}

export interface CurriculumGraph {
  nodes: CurriculumNode[];
  edges: CurriculumEdge[];
}

const SEVIYE_ORDER: readonly Seviye[] = ["ortaokul", "lise", "universite"];

const COLUMN_WIDTH = 140;
const ROW_HEIGHT = 160;
const DOT_SPACING = 26;

export function computeCurriculumGraphLayout(
  lessons: readonly CurriculumLessonInput[],
  hatOrder: readonly string[],
): CurriculumGraph {
  const hatIndex = new Map(hatOrder.map((hat, index) => [hat, index]));
  const seviyeIndex = new Map(SEVIYE_ORDER.map((seviye, index) => [seviye, index]));

  const groupCounts = new Map<string, number>();
  const nodes: CurriculumNode[] = lessons.map((input) => {
    const groupKey = `${input.hat}|${input.seviye}`;
    const positionInGroup = groupCounts.get(groupKey) ?? 0;
    groupCounts.set(groupKey, positionInGroup + 1);

    const columnBase = (hatIndex.get(input.hat) ?? 0) * COLUMN_WIDTH;
    return {
      id: input.id,
      baslik: input.baslik,
      hat: input.hat,
      seviye: input.seviye,
      x: columnBase + positionInGroup * DOT_SPACING,
      y: (seviyeIndex.get(input.seviye) ?? 0) * ROW_HEIGHT,
    };
  });

  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const edges: CurriculumEdge[] = [];
  for (const lesson of lessons) {
    for (const prerequisiteId of lesson.onkosul) {
      const prerequisite = lessonById.get(prerequisiteId);
      if (!prerequisite) continue;
      edges.push({
        fromId: prerequisiteId,
        toId: lesson.id,
        crossHat: prerequisite.hat !== lesson.hat,
      });
    }
  }

  return { nodes, edges };
}
