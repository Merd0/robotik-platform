import { describe, expect, it } from "vitest";
import { getLessonBySlug } from "./content";
import {
  extractComponentStringProp,
  extractUsedComponents,
} from "./interactionManifest";
import { getPublicModuleBySlug } from "./kodAkademisi";

const MATCHES = [
  {
    lesson: "d-lise-degiskenlerle-hareket",
    lab: "CodeRunner",
    module: "koda-temel-degisken-degistir",
    href: "/kod-akademisi/temel/koda-temel-degisken-degistir",
  },
  {
    lesson: "d-lise-donguyle-cok-nokta",
    lab: "CodeRunner",
    module: "koda-orta-donguyle-uc-nokta",
    href: "/kod-akademisi/orta/koda-orta-donguyle-uc-nokta",
  },
  {
    lesson: "d-lise-kosullu-robot-durumu",
    lab: "CodeRunner",
    module: "koda-orta-kosul-ile-dal",
    href: "/kod-akademisi/orta/koda-orta-kosul-ile-dal",
  },
  {
    lesson: "d-lise-fonksiyonla-hareket-dizisi",
    lab: "CodeRunner",
    module: "koda-ileri-fonksiyonla-liste",
    href: "/kod-akademisi/ileri/koda-ileri-fonksiyonla-liste",
  },
] as const;

describe("Kavram → Simülasyon → Kod eşleşmeleri", () => {
  it.each(MATCHES)("$lesson yalnız var olan laboratuvar ve Kod Akademisi modülünü bağlar", (match) => {
    const lesson = getLessonBySlug(match.lesson);
    const codeModule = getPublicModuleBySlug(match.module);

    expect(lesson, `${match.lesson} bulunamadı`).toBeDefined();
    expect(codeModule, `${match.module} bulunamadı`).toBeDefined();
    expect(codeModule?.frontmatter.robot).toBe("generic-2dof");

    const components = extractUsedComponents(lesson!.body);
    expect(components).toContain(match.lab);
    expect(components).toContain("ConceptSimulationCode");
    expect(extractComponentStringProp(lesson!.body, "ConceptSimulationCode", "codeHref"))
      .toEqual([match.href]);
  });

  it("yalnız benzer görünen ters kinematik dersine uydurma Kod Akademisi bağı eklemez", () => {
    const lesson = getLessonBySlug("b-lise-geometrik-ters-kinematik");
    expect(lesson).toBeDefined();
    expect(extractUsedComponents(lesson!.body)).not.toContain("ConceptSimulationCode");
  });
});
