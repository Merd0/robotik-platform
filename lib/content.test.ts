import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_LESSON_SABLON,
  getAllLessons,
  getLessonBySlug,
  getPublicLessonBySlug,
  getPublicLessons,
  LESSON_SABLON_DEGERLERI,
  resolveLessonSablon,
  taslakOnizlemeAcik,
} from "./content";

/**
 * Taslak derslerin üretimde herkese açık OLMAMASI kuralının testleri.
 *
 * Bu insan incelemesi güvencesi değil, editoryal yayın durumunun teknik
 * güvencesidir. Hat H güvenlik dersleri de dahil, `durum: yayinda` olmayan
 * hiçbir içerik URL'i bilinerek açılabilir olmamalı.
 *
 * Derleme çıktısı üzerindeki karşılığı: `scripts/check-no-draft-pages.ts`.
 */

const ORIJINAL_NODE_ENV = process.env.NODE_ENV;
const ORIJINAL_ONIZLEME = process.env.ICERIK_TASLAK_ONIZLEME;

function ortamiAyarla(nodeEnv: string, onizleme?: string) {
  // NODE_ENV Node tiplemesinde salt okunur sayılır; testte bilinçli olarak
  // geçersiz kılıyoruz.
  (process.env as Record<string, string | undefined>).NODE_ENV = nodeEnv;
  if (onizleme === undefined) delete process.env.ICERIK_TASLAK_ONIZLEME;
  else process.env.ICERIK_TASLAK_ONIZLEME = onizleme;
}

afterEach(() => {
  ortamiAyarla(ORIJINAL_NODE_ENV ?? "test", ORIJINAL_ONIZLEME);
});

describe("taslakOnizlemeAcik", () => {
  it("üretimde kapalı", () => {
    ortamiAyarla("production");
    expect(taslakOnizlemeAcik()).toBe(false);
  });

  it("geliştirmede açık", () => {
    ortamiAyarla("development");
    expect(taslakOnizlemeAcik()).toBe(true);
  });

  it("ICERIK_TASLAK_ONIZLEME=1 üretimde de açar (bilinçli önizleme derlemesi)", () => {
    ortamiAyarla("production", "1");
    expect(taslakOnizlemeAcik()).toBe(true);
  });
});

describe("getPublicLessons — üretim", () => {
  it("tek bir taslak ders bile döndürmez", () => {
    ortamiAyarla("production");
    const taslaklar = getPublicLessons().filter((ders) => ders.frontmatter.durum !== "yayinda");
    expect(taslaklar.map((ders) => ders.slug)).toEqual([]);
  });

  it("yayınlanmış derslerin hepsini döndürür", () => {
    ortamiAyarla("production");
    const beklenen = getAllLessons()
      .filter((ders) => ders.frontmatter.durum === "yayinda")
      .map((ders) => ders.slug)
      .sort();
    expect(getPublicLessons().map((ders) => ders.slug).sort()).toEqual(beklenen);
  });

  it("HİÇBİR taslak slug'ı tekil erişimle açılamaz — Hat H güvenlik dersleri dahil", () => {
    ortamiAyarla("production");
    const taslaklar = getAllLessons().filter((ders) => ders.frontmatter.durum !== "yayinda");

    // 2026-08-10'da bütün taslaklar yayına alındığı için korpus şu an taslak
    // içermeyebilir. Kural yine de geçerli ve ileride yazılacak taslaklar için
    // korunmalı: "taslak" işaretli bir ders herkese açık kümede olamaz. Bu
    // yüzden test artık taslak VARLIĞINI şart koşmuyor; taslak varsa dışarıda
    // kaldığını, yoksa filtrenin gerçekten `durum` alanına baktığını doğruluyor.
    //
    // Herkese açık küme bir kez hesaplanır; her slug için getPublicLessonBySlug
    // çağırmak 89 MDX dosyasını taslak sayısı kadar yeniden okurdu (testi
    // saniyeler süren, zaman aşımına açık bir şeye çevirir).
    const acikSluglar = new Set(getPublicLessons().map((ders) => ders.slug));
    const sizanlar = taslaklar.map((ders) => ders.slug).filter((slug) => acikSluglar.has(slug));
    expect(sizanlar).toEqual([]);

    if (taslaklar.length > 0) {
      // Tekil erişim yolunun kendisi de kapalı olmalı — bir örnekle doğrula.
      expect(getPublicLessonBySlug(taslaklar[0].slug)).toBeUndefined();
    } else {
      const yayindakiler = getAllLessons().filter((ders) => ders.frontmatter.durum === "yayinda");
      expect(acikSluglar.size).toBe(yayindakiler.length);
      expect(getPublicLessonBySlug("var-olmayan-taslak-slug")).toBeUndefined();
    }
  });

  it("Hat H'de taslak kalan hiçbir ders erişilebilir değil", () => {
    ortamiAyarla("production");
    const hatH = getAllLessons().filter((ders) => ders.frontmatter.hat === "h-guvenlik");
    expect(hatH.length).toBeGreaterThan(0);

    const acikSluglar = new Set(getPublicLessons().map((ders) => ders.slug));
    const erisilebilir = hatH
      .filter((ders) => ders.frontmatter.durum !== "yayinda")
      .map((ders) => ders.slug)
      .filter((slug) => acikSluglar.has(slug));
    expect(erisilebilir).toEqual([]);
  });
});

describe("getPublicLessons — geliştirme", () => {
  it("taslaklar dahil hepsini döndürür (yazarken önizleme gerekiyor)", () => {
    ortamiAyarla("development");
    expect(getPublicLessons().length).toBe(getAllLessons().length);
  });
});

describe("build-scope ders kataloğu", () => {
  it("çağrılar arasında ayrıştırılmış ders nesnelerini ve slug indeksini yeniden kullanır", () => {
    const ilk = getAllLessons();
    const ikinci = getAllLessons();
    const ornek = ilk[0];

    expect(ilk).not.toBe(ikinci);
    expect(ikinci[0]).toBe(ornek);
    expect(getLessonBySlug(ornek.slug)).toBe(ornek);
  });
});

describe("resolveLessonSablon (Faz 1 — sunum şablonu)", () => {
  it("frontmatter'da sablon yoksa varsayılana (kesif) düşer", () => {
    expect(resolveLessonSablon(undefined)).toBe("kesif");
    expect(resolveLessonSablon(undefined)).toBe(DEFAULT_LESSON_SABLON);
  });

  it("bilinen bir şablon değerini olduğu gibi döndürür", () => {
    expect(resolveLessonSablon("gorev")).toBe("gorev");
    expect(resolveLessonSablon("karsilastirma")).toBe("karsilastirma");
    expect(resolveLessonSablon("kod-lab")).toBe("kod-lab");
    expect(resolveLessonSablon("referans")).toBe("referans");
  });

  it("bilinmeyen/bozuk bir değeri sessizce kesif'e düşürür (uydurma şablon render'ı çökertmesin)", () => {
    expect(resolveLessonSablon("yazim-hatasi")).toBe("kesif");
    expect(resolveLessonSablon("")).toBe("kesif");
  });

  it("94 gerçek dersin hepsi geçerli bir şablona çözülür", () => {
    for (const lesson of getAllLessons()) {
      expect(LESSON_SABLON_DEGERLERI).toContain(resolveLessonSablon(lesson.frontmatter.sablon));
    }
  });
});
