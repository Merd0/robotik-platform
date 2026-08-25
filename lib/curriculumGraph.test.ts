import { describe, expect, it } from "vitest";
import { computeCurriculumGraphLayout, type CurriculumLessonInput } from "./curriculumGraph";

const HATLAR = ["a-temeller", "b-kinematik"];

function lesson(overrides: Partial<CurriculumLessonInput> & Pick<CurriculumLessonInput, "id" | "hat" | "seviye">): CurriculumLessonInput {
  return { baslik: overrides.id, onkosul: [], ...overrides };
}

describe("computeCurriculumGraphLayout", () => {
  it("her ders için tam bir düğüm üretir", () => {
    const lessons = [
      lesson({ id: "a1", hat: "a-temeller", seviye: "ortaokul" }),
      lesson({ id: "a2", hat: "a-temeller", seviye: "lise" }),
      lesson({ id: "b1", hat: "b-kinematik", seviye: "ortaokul" }),
    ];
    const graph = computeCurriculumGraphLayout(lessons, HATLAR);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.nodes.map((n) => n.id).sort()).toEqual(["a1", "a2", "b1"]);
  });

  it("aynı hat + seviyede birden fazla ders varsa çakışmayan x konumları üretir", () => {
    const lessons = [
      lesson({ id: "a1", hat: "a-temeller", seviye: "ortaokul" }),
      lesson({ id: "a2", hat: "a-temeller", seviye: "ortaokul" }),
      lesson({ id: "a3", hat: "a-temeller", seviye: "ortaokul" }),
    ];
    const graph = computeCurriculumGraphLayout(lessons, HATLAR);
    const xs = graph.nodes.map((n) => n.x);
    expect(new Set(xs).size).toBe(3);
  });

  it("farklı seviyedeki dersler farklı y konumunda olur, aynı seviyedekiler aynı y'de", () => {
    const lessons = [
      lesson({ id: "a1", hat: "a-temeller", seviye: "ortaokul" }),
      lesson({ id: "a2", hat: "a-temeller", seviye: "lise" }),
      lesson({ id: "a3", hat: "a-temeller", seviye: "universite" }),
      lesson({ id: "a4", hat: "a-temeller", seviye: "ortaokul" }),
    ];
    const graph = computeCurriculumGraphLayout(lessons, HATLAR);
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    expect(byId.get("a1")!.y).toBe(byId.get("a4")!.y);
    expect(byId.get("a1")!.y).not.toBe(byId.get("a2")!.y);
    expect(byId.get("a2")!.y).not.toBe(byId.get("a3")!.y);
  });

  it("gerçek onkosul ilişkisi için bir kenar üretir", () => {
    const lessons = [
      lesson({ id: "a1", hat: "a-temeller", seviye: "ortaokul" }),
      lesson({ id: "a2", hat: "a-temeller", seviye: "lise", onkosul: ["a1"] }),
    ];
    const graph = computeCurriculumGraphLayout(lessons, HATLAR);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({ fromId: "a1", toId: "a2" });
  });

  it("var olmayan bir onkosul'u sessizce atlar (kırık kenar üretmez)", () => {
    const lessons = [lesson({ id: "a2", hat: "a-temeller", seviye: "lise", onkosul: ["hic-yok"] })];
    const graph = computeCurriculumGraphLayout(lessons, HATLAR);
    expect(graph.edges).toHaveLength(0);
  });

  it("farklı hat'lar arası bir ön koşulu crossHat: true olarak işaretler", () => {
    const lessons = [
      lesson({ id: "a1", hat: "a-temeller", seviye: "ortaokul" }),
      lesson({ id: "b1", hat: "b-kinematik", seviye: "lise", onkosul: ["a1"] }),
    ];
    const graph = computeCurriculumGraphLayout(lessons, HATLAR);
    expect(graph.edges[0].crossHat).toBe(true);
  });

  it("aynı hat içindeki bir ön koşulu crossHat: false olarak işaretler", () => {
    const lessons = [
      lesson({ id: "a1", hat: "a-temeller", seviye: "ortaokul" }),
      lesson({ id: "a2", hat: "a-temeller", seviye: "lise", onkosul: ["a1"] }),
    ];
    const graph = computeCurriculumGraphLayout(lessons, HATLAR);
    expect(graph.edges[0].crossHat).toBe(false);
  });

  it("boş ders listesi için boş graph döner", () => {
    const graph = computeCurriculumGraphLayout([], HATLAR);
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });
});
