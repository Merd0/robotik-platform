import { describe, expect, it } from "vitest";
import { getSeoAnchorTermsInText, getSozluk, getTerimBySlug, SEO_ANCHOR_TERM_SLUGS, terimSlug } from "./sozluk";

describe("sözlük URL'leri", () => {
  it("72 terimin her biri için benzersiz bir statik slug üretir", () => {
    const terimler = getSozluk();
    const sluglar = terimler.map((terim) => terimSlug(terim.tr));

    expect(terimler).toHaveLength(72);
    expect(new Set(sluglar).size).toBe(72);
    expect(sluglar.every(Boolean)).toBe(true);
  });

  it("Türkçe karakterleri okunabilir URL parçalarına dönüştürür", () => {
    expect(terimSlug("Tekillik")).toBe("tekillik");
    expect(terimSlug("ters kinematik")).toBe("ters-kinematik");
    expect(terimSlug("el-göz kalibrasyonu")).toBe("el-goz-kalibrasyonu");
    expect(terimSlug("ölçüm belirsizliği")).toBe("olcum-belirsizligi");
  });

  it("slug üzerinden doğru terimi bulur", () => {
    expect(getTerimBySlug("el-goz-kalibrasyonu")?.en).toBe("hand-eye calibration");
    expect(getTerimBySlug("olmayan-terim")).toBeUndefined();
  });
});

describe("Faz 4 — en yüksek niyetli terimler (karisan + geri bağlantı)", () => {
  it("SEO_ANCHOR_TERM_SLUGS'taki her slug gerçekten sözlükte bir terime karşılık gelir", () => {
    for (const slug of SEO_ANCHOR_TERM_SLUGS) {
      expect(getTerimBySlug(slug), `${slug} sözlükte bulunamadı`).toBeDefined();
    }
  });

  it("10-15 terim aralığında (görev kapsamı)", () => {
    expect(SEO_ANCHOR_TERM_SLUGS.length).toBeGreaterThanOrEqual(10);
    expect(SEO_ANCHOR_TERM_SLUGS.length).toBeLessThanOrEqual(15);
  });

  it("her anchor terimin karisan alanı var ve karisan.slug varsa gerçek bir terime işaret eder", () => {
    for (const slug of SEO_ANCHOR_TERM_SLUGS) {
      const terim = getTerimBySlug(slug)!;
      expect(terim.karisan, `${slug} için karisan alanı yok`).toBeDefined();
      expect(terim.karisan!.fark.length).toBeGreaterThan(20);
      if (terim.karisan!.slug) {
        expect(getTerimBySlug(terim.karisan!.slug!), `${slug}.karisan.slug (${terim.karisan!.slug}) sözlükte yok`).toBeDefined();
      }
    }
  });

  it("karşılıklı çiftlerde (ör. ters/ileri kinematik) her iki taraf da birbirine işaret eder", () => {
    const ciftler: Array<[string, string]> = [
      ["ters-kinematik", "ileri-kinematik"],
      ["tekillik", "manipulabilite"],
      ["konfigurasyon-uzayi", "calisma-uzayi"],
      ["kamera-kalibrasyonu", "el-goz-kalibrasyonu"],
    ];
    for (const [a, b] of ciftler) {
      expect(getTerimBySlug(a)?.karisan?.slug).toBe(b);
      expect(getTerimBySlug(b)?.karisan?.slug).toBe(a);
    }
  });

  it("getSeoAnchorTermsInText: metinde geçen anchor terimleri bulur, geçmeyenleri bulmaz", () => {
    const metin = "Bu derste ters kinematik ve Jacobian matrisi ele alınır.";
    const bulunanlar = getSeoAnchorTermsInText(metin).map((terim) => terim.tr);
    expect(bulunanlar).toContain("ters kinematik");
    expect(bulunanlar).toContain("Jacobian matrisi");
    expect(bulunanlar).not.toContain("tekillik");
    expect(bulunanlar).not.toContain("ileri kinematik");
  });

  it("getSeoAnchorTermsInText: hiçbir anchor terim geçmeyen metinde boş dizi döner", () => {
    expect(getSeoAnchorTermsInText("Alakasız bir cümle, robotik terimi yok.")).toEqual([]);
  });

  it("getSeoAnchorTermsInText: sonuç sırası SEO_ANCHOR_TERM_SLUGS sırasıyla kararlı", () => {
    const metin = "Jacobian matrisi ve ters kinematik ve tekillik burada geçer.";
    const sluglar = getSeoAnchorTermsInText(metin).map((terim) => terimSlug(terim.tr));
    const beklenenSira = SEO_ANCHOR_TERM_SLUGS.filter((slug) => sluglar.includes(slug));
    expect(sluglar).toEqual(beklenenSira);
  });

  it("gerçek dünyadaki dersler beklenen terimleri buluyor (regresyon)", async () => {
    const { getPublicLessonBySlug } = await import("./content");
    const dersJacobian = getPublicLessonBySlug("b-universite-jacobian");
    expect(dersJacobian).toBeDefined();
    const bulunanlar = getSeoAnchorTermsInText(dersJacobian!.body).map((terim) => terim.tr);
    expect(bulunanlar).toContain("Jacobian matrisi");
    expect(bulunanlar).toContain("tekillik");
  });

  it("parantez içi kısaltma tam öbek eşleşmesini bozmaz: 'Denavit-Hartenberg (DH) parametreleri'", () => {
    const bulunanlar = getSeoAnchorTermsInText("Bugün Denavit-Hartenberg (DH) parametreleri işleniyor.").map((terim) => terim.tr);
    expect(bulunanlar).toContain("Denavit-Hartenberg parametreleri");
  });

  it("yaygın kısaltma takma adı da eşleşir: 'DH parametreleri' → Denavit-Hartenberg parametreleri", () => {
    const bulunanlar = getSeoAnchorTermsInText("DH parametreleri tek bir açık zincir mimarisini varsayar.").map((terim) => terim.tr);
    expect(bulunanlar).toContain("Denavit-Hartenberg parametreleri");
  });

  it("gerçek DH dersi gövdesinde (yalnız kısaltmayla yazılmış olsa da) terimi bulur", async () => {
    const { getPublicLessonBySlug } = await import("./content");
    const dersDh = getPublicLessonBySlug("a-universite-dh-parametreleri");
    expect(dersDh).toBeDefined();
    const bulunanlar = getSeoAnchorTermsInText(dersDh!.body).map((terim) => terim.tr);
    expect(bulunanlar).toContain("Denavit-Hartenberg parametreleri");
  });
});
