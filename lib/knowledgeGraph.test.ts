import { afterEach, describe, expect, it } from "vitest";
import { getPublishedLessons } from "./content";
import { getPublicModules } from "./kodAkademisi";
import {
  buildKnowledgeGraph,
  getKnowledgeGraphNeighborhood,
} from "./knowledgeGraph";
import { getSozluk } from "./sozluk";

const ORIGINAL_PREVIEW = process.env.ICERIK_TASLAK_ONIZLEME;

afterEach(() => {
  if (ORIGINAL_PREVIEW === undefined) delete process.env.ICERIK_TASLAK_ONIZLEME;
  else process.env.ICERIK_TASLAK_ONIZLEME = ORIGINAL_PREVIEW;
});

describe("Robotics Knowledge Graph", () => {
  it("yayınlı ders, sözlük, etkileşim/lab ve Kod Akademisi düğümlerini gerçek kataloglardan türetir", () => {
    const graph = buildKnowledgeGraph();
    const lessons = getPublishedLessons();
    const modules = getPublicModules().filter((module) => module.frontmatter.durum === "yayinda");
    const labs = new Set(lessons.flatMap((lesson) => lesson.frontmatter.etkilesimli));

    expect(graph.summary).toEqual({
      lessons: lessons.length,
      terms: getSozluk().length,
      labs: labs.size,
      codeModules: modules.length,
      totalNodes: lessons.length + getSozluk().length + labs.size + modules.length,
    });
    expect(graph.nodes).toHaveLength(graph.summary.totalNodes);
  });

  it("önizleme açıkken bile taslak ders veya Kod Akademisi modülü sızdırmaz", () => {
    process.env.ICERIK_TASLAK_ONIZLEME = "1";
    const graph = buildKnowledgeGraph();

    expect(graph.nodes.filter((node) => node.kind === "lesson")).toHaveLength(getPublishedLessons().length);
    expect(graph.nodes.filter((node) => node.kind === "code")).toHaveLength(
      getPublicModules().filter((module) => module.frontmatter.durum === "yayinda").length,
    );
  });

  it("her önkoşul ve etkileşim kenarını var olan frontmatter alanından birebir kurar", () => {
    const graph = buildKnowledgeGraph();
    const lessons = getPublishedLessons();
    const prerequisiteEdges = graph.edges.filter((edge) => edge.relation === "prerequisite");
    const interactionEdges = graph.edges.filter((edge) => edge.relation === "interaction");

    expect(prerequisiteEdges).toHaveLength(lessons.reduce((count, lesson) => count + lesson.frontmatter.onkosul.length, 0));
    expect(interactionEdges).toHaveLength(lessons.reduce((count, lesson) => count + new Set(lesson.frontmatter.etkilesimli).size, 0));
    expect(prerequisiteEdges).toContainEqual(expect.objectContaining({
      from: "lesson:b-lise-geometrik-ters-kinematik",
      to: "lesson:b-universite-ters-kinematik",
    }));
  });

  it("Kod Akademisi kenarlarını yeni önkoşul icat etmeden yalnız aşama içi sıradan kurar", () => {
    const graph = buildKnowledgeGraph();
    const codeSequence = graph.edges.filter((edge) => edge.relation === "code-sequence");
    const publishedByStage = Object.groupBy(
      getPublicModules().filter((module) => module.frontmatter.durum === "yayinda"),
      (module) => module.frontmatter.asama,
    );
    const expected = Object.values(publishedByStage).reduce((total, modules) => total + Math.max(0, (modules?.length ?? 0) - 1), 0);

    expect(codeSequence).toHaveLength(expected);
  });

  it("TCP düğümünden mevcut ilgili-terim eşleşmeli dersleri ve iki adımda onların lablarını bulur", () => {
    const graph = buildKnowledgeGraph();
    const neighborhood = getKnowledgeGraphNeighborhood(graph, "term:alet-merkez-noktasi", 2);
    const directLessons = neighborhood.nodes
      .filter((item) => item.distance === 1 && item.node.kind === "lesson")
      .map((item) => item.node.id)
      .sort();

    expect(directLessons).toEqual([
      "lesson:a-lise-calisma-uzayi",
      "lesson:a-lise-doner-dogrusal-eklemler",
      "lesson:a-lise-tcp-kavrami",
      "lesson:d-universite-kuka-krl",
    ]);
    expect(neighborhood.nodes.some((item) => item.distance === 2 && item.node.kind === "lab")).toBe(true);
  });

  it("tüm kenar uçlarını var olan düğümlere bağlar ve aynı ilişkiyi çoğaltmaz", () => {
    const graph = buildKnowledgeGraph();
    const ids = new Set(graph.nodes.map((node) => node.id));
    const edgeIds = graph.edges.map((edge) => edge.id);

    expect(graph.edges.every((edge) => ids.has(edge.from) && ids.has(edge.to))).toBe(true);
    expect(new Set(edgeIds).size).toBe(edgeIds.length);
  });
});
