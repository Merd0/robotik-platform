import { describe, expect, it } from "vitest";
import { aramaNormalize, aramaYap, indeksHazirla, mdxDuzMetne, type AramaKaydiHam } from "./arama";

const ORNEK: AramaKaydiHam[] = [
  {
    id: "b-lise-ileri-kinematik",
    baslik: "İki eklemli kolda ileri kinematik",
    hat: "b-kinematik",
    hatEtiket: "Hareket ve kinematik",
    seviye: "lise",
    seviyeEtiket: "Lise",
    sure: 15,
    metin: "Eklem açılarından uç noktanın konumunu trigonometri ile hesaplarsın.",
  },
  {
    id: "f-universite-olcum-belirsizligi",
    baslik: "Ölçüm belirsizliği ve tekrarlanabilirlik",
    hat: "f-algilama",
    hatEtiket: "Algılama: sensör ve görü",
    seviye: "universite",
    seviyeEtiket: "Üniversite",
    sure: 20,
    metin: "Aynı parçayı defalarca ölçersen sonuçlar birebir aynı çıkmaz.",
  },
];

describe("aramaNormalize", () => {
  it("Türkçe harfleri ASCII karşılığına indirir", () => {
    expect(aramaNormalize("Ölçüm Belirsizliği")).toBe("olcum belirsizligi");
    expect(aramaNormalize("İLERİ Kinematik")).toBe("ileri kinematik");
    expect(aramaNormalize("Işık")).toBe("isik");
  });

  it("uzunluğu korur — parça çıkarma indis hizasına dayanıyor", () => {
    const metin = "Ölçüm belirsizliği, ığdır, ŞÜKRÜ, çâî";
    expect(aramaNormalize(metin)).toHaveLength(metin.length);
  });
});

describe("aramaYap", () => {
  const indeks = indeksHazirla(ORNEK);

  it("Türkçe karakter yazılmadan da bulur", () => {
    const sonuc = aramaYap(indeks, "olcum");
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0].kayit.id).toBe("f-universite-olcum-belirsizligi");
  });

  it("başlıkta geçen eşleşmeyi gövdedekinden yukarı sıralar", () => {
    const sonuc = aramaYap(indeks, "kinematik");
    expect(sonuc[0].kayit.id).toBe("b-lise-ileri-kinematik");
    expect(sonuc[0].skor).toBe(3);
  });

  it("her kelime eşleşmeli (VE mantığı)", () => {
    expect(aramaYap(indeks, "kinematik belirsizlik")).toHaveLength(0);
    expect(aramaYap(indeks, "ileri kinematik")).toHaveLength(1);
  });

  it("boş sorguda sonuç döndürmez", () => {
    expect(aramaYap(indeks, "   ")).toHaveLength(0);
  });

  it("hat etiketiyle de eşleşir", () => {
    expect(aramaYap(indeks, "algilama")).toHaveLength(1);
  });

  it("eşleşmenin geçtiği yerden bağlam çıkarır", () => {
    const sonuc = aramaYap(indeks, "trigonometri");
    expect(sonuc[0].parca).toContain("trigonometri");
  });
});

describe("mdxDuzMetne", () => {
  it("bileşenleri, kod bloklarını ve markdown işaretlerini temizler", () => {
    const govde = [
      "## Kanca",
      "",
      "Bir **robot** kolu `iki` eklemli.",
      "",
      "<JointSliders robot=\"generic-2dof\" />",
      "",
      "```python",
      "robot.eklem_ac(0, 45)",
      "```",
      "",
      "- Bkz. [Modern Robotics](https://example.org/mr)",
      "",
      "> Uyarı. Bu ders bir risk değerlendirmesi değildir.",
    ].join("\n");

    const duz = mdxDuzMetne(govde);
    expect(duz).toBe(
      "Kanca Bir robot kolu iki eklemli. Bkz. Modern Robotics Uyarı. Bu ders bir risk değerlendirmesi değildir.",
    );
  });

  it("çok satırlı bileşen prop'larını da atar", () => {
    const govde = '<Quiz\n  sorular={[\n    { soru: "Sızmamalı", dogru: 1 }\n  ]}\n/>\n\nDers metni.';
    expect(mdxDuzMetne(govde)).toBe("Ders metni.");
  });
});
