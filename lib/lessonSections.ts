import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import type { Node } from "unist";

/**
 * docs/04-icerik-rehberi.md'deki 6 bölümlük ders şablonunun (Kanca /
 * etkileşimli sahne / Ne oldu / Gerçek dünyada / Dene / Sonraki) sabit 5
 * H2 başlığı — "sahne" ayrı bir başlık değil, Kanca'nın hemen devamındaki
 * etkileşimli bileşendir (bkz. docs/durum-denetim.md "Faz 1" taksonomisi).
 */
export const LESSON_SECTION_HEADINGS = ["Kanca", "Ne oldu", "Gerçek dünyada", "Dene", "Sonraki"] as const;
export type LessonSectionName = (typeof LESSON_SECTION_HEADINGS)[number];
export type LessonSections = Record<LessonSectionName, string>;

interface HeadingChild {
  type: string;
  value?: string;
}

interface HeadingNode extends Node {
  depth: number;
  children: HeadingChild[];
}

function headingText(node: HeadingNode): string {
  return node.children.map((child) => child.value ?? "").join("").trim();
}

/**
 * Ham MDX gövdesini docs/04'ün 5 sabit başlığına göre diliyor — SUNUM
 * katmanı (`sablon`) bu dilimleri farklı sırada/çerçevede render edebilsin
 * diye (bkz. lib/content.ts LessonSablon). Naif satır regex'i DEĞİL: Hat D
 * derslerindeki Python kod bloklarında "## yorum" gibi satırlar yanlışlıkla
 * başlık sanılabilirdi (bkz. content/d-programlama/**). AST tabanlı ayrıştırma
 * (`lib/interactionManifest.ts`teki `extractUsedComponents` ile aynı desen)
 * kod çiti içindeki metni ayrı bir düğüm saydığı için bu riski taşımaz.
 *
 * Beklenen 5 başlık TAM VE SIRALI eşleşmezse (eksik/fazla/farklı sıra/başlık
 * öncesi metin varsa) `null` döner — çağıran taraf bu durumda mevcut
 * bölünmemiş render'a düşmeli. Bilinçli güvenlik ağı: şablon beklentisine
 * uymayan bir ders sayfayı çökertmez, yalnızca bölünmeden render edilir.
 *
 * Dilimler ARDIŞIK VE ÇAKIŞMASIZ üretilir (her dilim bir sonraki başlığın
 * başladığı yerde biter) — bu yüzden sırayla birleştirmek orijinal gövdeyi
 * (ilk başlıktan itibaren) birebir yeniden üretir; `lessonSections.test.ts`
 * bunu 94 gerçek ders üzerinde doğrular.
 */
export function splitLessonBody(mdxBody: string): LessonSections | null {
  const { content: govde } = matter(mdxBody);
  const agac = unified().use(remarkParse).use(remarkMdx).parse(govde);

  const headings: { name: string; start: number }[] = [];
  visit(agac, (node: Node) => {
    if (node.type !== "heading") return;
    const heading = node as HeadingNode;
    if (heading.depth !== 2) return;
    const start = heading.position?.start.offset;
    if (start === undefined) return;
    headings.push({ name: headingText(heading), start });
  });

  if (headings.length !== LESSON_SECTION_HEADINGS.length) return null;
  if (!headings.every((heading, index) => heading.name === LESSON_SECTION_HEADINGS[index])) return null;
  if (govde.slice(0, headings[0].start).trim() !== "") return null;

  const sections = {} as LessonSections;
  headings.forEach((heading, index) => {
    const sectionEnd = index + 1 < headings.length ? headings[index + 1].start : govde.length;
    sections[heading.name as LessonSectionName] = govde.slice(heading.start, sectionEnd);
  });

  return sections;
}
