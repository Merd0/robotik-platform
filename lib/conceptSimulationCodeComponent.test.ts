import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConceptSimulationCode } from "@/components/interactive/ConceptSimulationCode";

describe("ConceptSimulationCode", () => {
  it("kavram, simülasyon ve kodu sıralı ve erişilebilir tek bir akışta sunar", () => {
    const html = renderToStaticMarkup(
      createElement(ConceptSimulationCode, {
        concept: "Bir hedefi isimli bir değişkende tut.",
        simulation: "CodeRunner hedefi robotun eklem duruşuna uygular.",
        code: "Aynı değişkeni çalışan bir movej görevi içinde değiştir.",
        codeHref: "/kod-akademisi/temel/koda-temel-degisken-degistir",
        codeLabel: "Değeri değiştir modülünü aç",
      }),
    );

    expect(html).toContain('<section aria-labelledby="concept-simulation-code-title"');
    expect(html).toContain("Kavram → Simülasyon → Kod");
    expect(html).toContain("1. Kavram");
    expect(html).toContain("2. Simülasyon");
    expect(html).toContain("3. Kod");
    expect(html.match(/<li/g)).toHaveLength(3);
    expect(html).toContain('href="/kod-akademisi/temel/koda-temel-degisken-degistir"');
    expect(html).toContain("Değeri değiştir modülünü aç");
  });
});
