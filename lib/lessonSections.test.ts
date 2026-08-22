import { describe, expect, it } from "vitest";
import { getAllLessons } from "./content";
import { LESSON_SECTION_HEADINGS, splitLessonBody, type LessonSections } from "./lessonSections";

const ORNEK_GOVDE = `## Kanca

Bir soru.

<JointSliders robot="generic-2dof" />

## Ne oldu

Açıklama metni.

## Gerçek dünyada

Somut örnek.

## Dene

<Quiz sorular={[]} />

## Sonraki

Bağlantı.
`;

describe("splitLessonBody", () => {
  it("5 sabit başlığı sırasıyla ayırır", () => {
    const sections = splitLessonBody(ORNEK_GOVDE) as LessonSections;
    expect(sections).not.toBeNull();
    for (const baslik of LESSON_SECTION_HEADINGS) {
      expect(sections[baslik]).toContain(`## ${baslik}`);
    }
    expect(sections["Kanca"]).toContain("Bir soru.");
    expect(sections["Kanca"]).toContain("<JointSliders");
    expect(sections["Kanca"]).not.toContain("## Ne oldu");
    expect(sections["Dene"]).toContain("<Quiz");
    expect(sections["Sonraki"]).toContain("Bağlantı.");
  });

  it("dilimler ardışık ve çakışmasız: sırayla birleştirmek orijinal gövdeyi (ilk başlıktan itibaren) birebir yeniden üretir", () => {
    const sections = splitLessonBody(ORNEK_GOVDE) as LessonSections;
    const yeniden = LESSON_SECTION_HEADINGS.map((baslik) => sections[baslik]).join("");
    const ilkBaslikOffseti = ORNEK_GOVDE.indexOf("## Kanca");
    expect(yeniden).toBe(ORNEK_GOVDE.slice(ilkBaslikOffseti));
  });

  it("Python kod bloğu içindeki '##' yorum satırını başlık sanmaz (Hat D regresyon testi)", () => {
    const govde = `## Kanca

Kanca metni.

\`\`\`python
## bu bir Python yorumu, başlık değil
robot.movej([0, 0])
\`\`\`

## Ne oldu

Açıklama.

## Gerçek dünyada

Örnek.

## Dene

Görev.

## Sonraki

Bağlantı.
`;
    const sections = splitLessonBody(govde) as LessonSections;
    expect(sections).not.toBeNull();
    expect(sections["Kanca"]).toContain("## bu bir Python yorumu");
    expect(sections["Kanca"]).toContain("robot.movej");
  });

  it("başlıklardan biri eksikse null döner", () => {
    const eksik = ORNEK_GOVDE.replace("## Sonraki\n\nBağlantı.\n", "");
    expect(splitLessonBody(eksik)).toBeNull();
  });

  it("başlık sırası farklıysa null döner", () => {
    const siraBozuk = `## Kanca\n\nMetin.\n\n## Gerçek dünyada\n\nMetin.\n\n## Ne oldu\n\nMetin.\n\n## Dene\n\nMetin.\n\n## Sonraki\n\nMetin.\n`;
    expect(splitLessonBody(siraBozuk)).toBeNull();
  });

  it("beklenmeyen fazladan bir başlık varsa null döner", () => {
    const fazlaBaslikli = ORNEK_GOVDE + "\n## Ekstra\n\nMetin.\n";
    expect(splitLessonBody(fazlaBaslikli)).toBeNull();
  });

  it("ilk başlıktan önce metin varsa (önsöz) null döner", () => {
    const onsozlu = "Bir önsöz cümlesi.\n\n" + ORNEK_GOVDE;
    expect(splitLessonBody(onsozlu)).toBeNull();
  });

  it("boş gövdede null döner", () => {
    expect(splitLessonBody("")).toBeNull();
  });

  it("94 gerçek dersin gövdesi bölünebiliyorsa dilimler kayıpsız birleşir (round-trip)", () => {
    let bolunenSayisi = 0;
    for (const lesson of getAllLessons()) {
      const sections = splitLessonBody(lesson.body);
      if (!sections) continue;
      bolunenSayisi += 1;
      const yeniden = LESSON_SECTION_HEADINGS.map((baslik) => sections[baslik]).join("");
      const ilkBaslikOffseti = lesson.body.indexOf("## Kanca");
      expect(yeniden, lesson.slug).toBe(lesson.body.slice(ilkBaslikOffseti));
    }
    // docs/04 şablonu tüm 94 dersin ortak sözleşmesi — pratikte hepsi bölünebilmeli.
    // Eşik (94 değil, biraz altı) gelecekte şablon-dışı istisnai bir ders
    // eklenirse testi kırılgan yapmasın diye kasıtlı gevşek.
    expect(bolunenSayisi).toBeGreaterThanOrEqual(90);
  });
});
