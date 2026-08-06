import { describe, expect, it } from "vitest";
import { mdxDenetle } from "./mdxGuvenlik";

/**
 * Bu testler saldırı denemeleridir: her biri, `blockJS: false` ayarı
 * yüzünden derleyiciden geçebilecek bir MDX örneğini allowlist'in
 * reddettiğini gösterir. Meşru içerik örnekleri de var — koruma çalışan
 * dersleri bozmuyor olmalı.
 */

const FRONTMATTER = `---
id: ornek
baslik: Örnek
hat: a-temeller
seviye: lise
sure: 1
onkosul: []
kazanimlar: ["x"]
kaynaklar: ["y"]
etkilesimli: []
durum: taslak
---
`;

const ders = (govde: string) => `${FRONTMATTER}\n${govde}\n`;

describe("reddedilmesi gerekenler", () => {
  it("gövdede serbest JS ifadesi", () => {
    const bulgular = mdxDenetle(ders('{fetch("https://kotu.example")}'));
    expect(bulgular.length).toBeGreaterThan(0);
    expect(bulgular[0].mesaj).toContain("serbest");
  });

  it("<script> etiketi", () => {
    const bulgular = mdxDenetle(ders("<script>alert(1)</script>"));
    expect(bulgular.some((b) => b.mesaj.includes("script"))).toBe(true);
  });

  it("izinli listede olmayan bileşen", () => {
    const bulgular = mdxDenetle(ders('<BilinmeyenBilesen prop="x" />'));
    expect(bulgular.some((b) => b.mesaj.includes("izinli bileşen değil"))).toBe(true);
  });

  it("prop içinde fonksiyon çağrısı", () => {
    const bulgular = mdxDenetle(
      ders('<Quiz sorular={[{ soru: eval("1+1"), secenekler: ["a"], dogru: 0, aciklama: "z" }]} />'),
    );
    expect(bulgular.length).toBeGreaterThan(0);
  });

  it("prop içinde değişken/üye erişimi", () => {
    const bulgular = mdxDenetle(ders("<CodeRunner initialCode={process.env.SECRET} />"));
    expect(bulgular.length).toBeGreaterThan(0);
  });

  it("şablon dizesinde ${...} yerleştirmesi", () => {
    const bulgular = mdxDenetle(ders("<CodeRunner initialCode={`x = ${process.env.S}`} />"));
    expect(bulgular.some((b) => b.mesaj.includes("yerleştirmesi"))).toBe(true);
  });

  it("import ifadesi", () => {
    const bulgular = mdxDenetle(ders('import kotu from "kotu-paket";'));
    expect(bulgular.some((b) => b.mesaj.includes("import/export"))).toBe(true);
  });

  it("yayılım (spread) prop'u", () => {
    const bulgular = mdxDenetle(ders("<Quiz {...tehlikeli} />"));
    expect(bulgular.some((b) => b.mesaj.includes("yayılım"))).toBe(true);
  });
});

describe("meşru içerik geçmeli", () => {
  it("düz markdown", () => {
    expect(mdxDenetle(ders("## Kanca\n\nBu bir **paragraf**.\n"))).toEqual([]);
  });

  it("izinli bileşen, dize prop'u", () => {
    expect(mdxDenetle(ders('<JointSliders robot="generic-2dof" />'))).toEqual([]);
  });

  it("Quiz'in obje/dizi prop'u", () => {
    const govde =
      '<Quiz\n  sorular={[\n    { soru: "Soru?", secenekler: ["a", "b", "c"], dogru: 1, aciklama: "ipucu" },\n  ]}\n/>';
    expect(mdxDenetle(ders(govde))).toEqual([]);
  });

  it("yerleştirmesiz şablon dizesi (çok satırlı kod)", () => {
    const govde = "<CodeRunner\n  robot=\"generic-2dof\"\n  initialCode={`# yorum\\nrobot.eklem_ac(0, 45)\\n`}\n/>";
    expect(mdxDenetle(ders(govde))).toEqual([]);
  });

  it("sayısal ve boolean prop", () => {
    expect(mdxDenetle(ders("<ScanPath rows={6} adjustableRows={true} />"))).toEqual([]);
  });
});
