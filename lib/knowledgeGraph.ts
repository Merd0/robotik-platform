import {
  HAT_ETIKET,
  SEVIYE_ETIKET,
  getPublishedLessons,
  type Seviye,
} from "./content";
import { ETKILESIM_ETIKETI } from "./etkilesimEtiket";
import {
  ASAMA_ETIKET,
  KOD_AKADEMISI_ASAMALAR,
  getPublicModules,
} from "./kodAkademisi";
import type { KodAkademisiAsama } from "./kodAkademisiArtifact";
import { getSeoAnchorTermsInText, getSozluk, terimSlug } from "./sozluk";

export type KnowledgeNodeKind = "lesson" | "term" | "lab" | "code";
export type KnowledgeRelation =
  | "prerequisite"
  | "lesson-sequence"
  | "term-mention"
  | "confused-with"
  | "interaction"
  | "code-sequence";

export interface KnowledgeGraphNode {
  id: string;
  kind: KnowledgeNodeKind;
  label: string;
  subtitle: string;
  description: string;
  href?: string;
  hat?: string;
  level?: Seviye;
  stage?: KodAkademisiAsama;
  order: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  from: string;
  to: string;
  relation: KnowledgeRelation;
}

export interface KnowledgeGraphData {
  nodes: readonly KnowledgeGraphNode[];
  edges: readonly KnowledgeGraphEdge[];
  tracks: readonly { id: string; label: string; lessonCount: number; termCount: number }[];
  summary: {
    lessons: number;
    terms: number;
    labs: number;
    codeModules: number;
    totalNodes: number;
  };
}

function edgeId(relation: KnowledgeRelation, from: string, to: string) {
  return `${relation}:${from}->${to}`;
}

function addEdge(
  edges: KnowledgeGraphEdge[],
  seen: Set<string>,
  relation: KnowledgeRelation,
  from: string,
  to: string,
) {
  const id = edgeId(relation, from, to);
  if (seen.has(id)) return;
  seen.add(id);
  edges.push({ id, from, to, relation });
}

export function buildKnowledgeGraph(): KnowledgeGraphData {
  const lessons = getPublishedLessons().sort((a, b) => a.slug.localeCompare(b.slug, "tr"));
  const terms = getSozluk();
  const modules = getPublicModules()
    .filter((module) => module.frontmatter.durum === "yayinda")
    .sort((a, b) => {
      const stageDifference = KOD_AKADEMISI_ASAMALAR.indexOf(a.frontmatter.asama) - KOD_AKADEMISI_ASAMALAR.indexOf(b.frontmatter.asama);
      return stageDifference || a.frontmatter.sira - b.frontmatter.sira;
    });
  const interactionNames = [...new Set(lessons.flatMap((lesson) => lesson.frontmatter.etkilesimli))]
    .sort((a, b) => a.localeCompare(b, "tr"));

  const nodes: KnowledgeGraphNode[] = [
    ...lessons.map((lesson) => ({
      id: `lesson:${lesson.slug}`,
      kind: "lesson" as const,
      label: lesson.frontmatter.baslik,
      subtitle: `${SEVIYE_ETIKET[lesson.frontmatter.seviye]} · ${HAT_ETIKET[lesson.frontmatter.hat] ?? lesson.frontmatter.hat}`,
      description: lesson.frontmatter.kazanimlar[0] ?? "Yayınlı robotik dersi",
      href: `/ders/${lesson.slug}`,
      hat: lesson.frontmatter.hat,
      level: lesson.frontmatter.seviye,
      order: lesson.frontmatter.sira ?? 0,
    })),
    ...terms.map((term, index) => ({
      id: `term:${terimSlug(term.tr)}`,
      kind: "term" as const,
      label: term.tr,
      subtitle: term.en,
      description: term.tanim,
      href: `/sozluk/${terimSlug(term.tr)}`,
      hat: term.hat,
      order: index,
    })),
    ...interactionNames.map((name, index) => ({
      id: `lab:${name}`,
      kind: "lab" as const,
      label: ETKILESIM_ETIKETI[name] ?? name,
      subtitle: `Etkileşim bileşeni · ${name}`,
      description: "Bu düğüm, yayınlı derslerin etkilesimli frontmatter alanında kullanılan laboratuvar veya görev bileşenidir.",
      order: index,
    })),
    ...modules.map((module) => ({
      id: `code:${module.slug}`,
      kind: "code" as const,
      label: module.frontmatter.baslik,
      subtitle: `Kod Akademisi · ${ASAMA_ETIKET[module.frontmatter.asama]}`,
      description: module.frontmatter.kazanimlar[0] ?? "Yayınlı Kod Akademisi modülü",
      href: `/kod-akademisi/${module.frontmatter.asama}/${module.slug}`,
      stage: module.frontmatter.asama,
      order: module.frontmatter.sira,
    })),
  ];

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: KnowledgeGraphEdge[] = [];
  const seenEdges = new Set<string>();

  for (const lesson of lessons) {
    const lessonId = `lesson:${lesson.slug}`;
    for (const prerequisite of lesson.frontmatter.onkosul) {
      const prerequisiteId = `lesson:${prerequisite}`;
      if (nodeIds.has(prerequisiteId)) addEdge(edges, seenEdges, "prerequisite", prerequisiteId, lessonId);
    }
    for (const interaction of new Set(lesson.frontmatter.etkilesimli)) {
      addEdge(edges, seenEdges, "interaction", lessonId, `lab:${interaction}`);
    }
    for (const term of getSeoAnchorTermsInText(lesson.body)) {
      addEdge(edges, seenEdges, "term-mention", `term:${terimSlug(term.tr)}`, lessonId);
    }
  }

  const lessonsByTrackLevel = Object.groupBy(lessons, (lesson) => `${lesson.frontmatter.hat}:${lesson.frontmatter.seviye}`);
  for (const trackLessons of Object.values(lessonsByTrackLevel)) {
    const ordered = [...(trackLessons ?? [])].sort((a, b) => (a.frontmatter.sira ?? 0) - (b.frontmatter.sira ?? 0));
    for (let index = 1; index < ordered.length; index += 1) {
      addEdge(edges, seenEdges, "lesson-sequence", `lesson:${ordered[index - 1].slug}`, `lesson:${ordered[index].slug}`);
    }
  }

  const termIds = new Set(terms.map((term) => `term:${terimSlug(term.tr)}`));
  for (const term of terms) {
    if (!term.karisan?.slug) continue;
    const pair = [`term:${terimSlug(term.tr)}`, `term:${term.karisan.slug}`].sort();
    if (termIds.has(pair[0]) && termIds.has(pair[1])) {
      addEdge(edges, seenEdges, "confused-with", pair[0], pair[1]);
    }
  }

  for (const stage of KOD_AKADEMISI_ASAMALAR) {
    const ordered = modules
      .filter((module) => module.frontmatter.asama === stage)
      .sort((a, b) => a.frontmatter.sira - b.frontmatter.sira);
    for (let index = 1; index < ordered.length; index += 1) {
      addEdge(edges, seenEdges, "code-sequence", `code:${ordered[index - 1].slug}`, `code:${ordered[index].slug}`);
    }
  }

  const tracks = Object.entries(HAT_ETIKET).map(([id, label]) => ({
    id,
    label,
    lessonCount: lessons.filter((lesson) => lesson.frontmatter.hat === id).length,
    termCount: terms.filter((term) => term.hat === id).length,
  }));

  return {
    nodes,
    edges,
    tracks,
    summary: {
      lessons: lessons.length,
      terms: terms.length,
      labs: interactionNames.length,
      codeModules: modules.length,
      totalNodes: nodes.length,
    },
  };
}

export function getKnowledgeGraphNeighborhood(
  graph: KnowledgeGraphData,
  selectedId: string,
  maxDistance = 2,
) {
  const distanceById = new Map<string, number>([[selectedId, 0]]);
  const queue = [selectedId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const distance = distanceById.get(current)!;
    if (distance >= maxDistance) continue;
    for (const edge of graph.edges) {
      const adjacent = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (adjacent && !distanceById.has(adjacent)) {
        distanceById.set(adjacent, distance + 1);
        queue.push(adjacent);
      }
    }
  }

  const nodes = graph.nodes
    .filter((node) => distanceById.has(node.id))
    .map((node) => ({ node, distance: distanceById.get(node.id)! }))
    .sort((a, b) => a.distance - b.distance || a.node.label.localeCompare(b.node.label, "tr"));
  const visibleIds = new Set(nodes.map((item) => item.node.id));
  const edges = graph.edges.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to));

  return { nodes, edges };
}
