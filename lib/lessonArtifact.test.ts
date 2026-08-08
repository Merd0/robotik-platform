import { describe, expect, it } from "vitest";
import type { DersFrontmatter } from "./content";
import { computeLessonArtifactHash } from "./lessonArtifact";

const frontmatter: DersFrontmatter = {
  id: "test-dersi",
  baslik: "Test dersi",
  hat: "a-temeller",
  seviye: "lise",
  sure: 10,
  onkosul: [],
  kazanimlar: ["Bir sonucu gözlemleme"],
  kaynaklar: ["Açık kaynak"],
  etkilesimli: [],
  durum: "inceleme",
};

describe("ders artifact hash'i", () => {
  it("satır sonlarını kanonikleştirir ve legacy review alanlarını dışarıda bırakır", () => {
    const left = computeLessonArtifactHash({
      frontmatter: { ...frontmatter, incelendi_tarafindan: "A", incelendi_tarih: "2026-08-01" },
      body: "## Kanca\r\n\r\nDeney.\r\n",
    });
    const right = computeLessonArtifactHash({
      frontmatter: { ...frontmatter, incelendi_tarafindan: "B", incelendi_tarih: "2026-08-09" },
      body: "## Kanca\n\nDeney.\n",
    });

    expect(left).toBe(right);
    expect(left).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("öğrencinin gördüğü içerik değişince hash'i değiştirir", () => {
    const original = computeLessonArtifactHash({ frontmatter, body: "İlk metin" });
    const changed = computeLessonArtifactHash({ frontmatter, body: "Değişen metin" });
    expect(changed).not.toBe(original);
  });
});
