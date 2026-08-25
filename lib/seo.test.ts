import { describe, expect, it } from "vitest";
import { getPublishedLessons } from "./content";
import {
  createPageMetadata,
  learningResourceJsonLd,
  lessonJsonLd,
  lessonUrl,
  pageCollectionJsonLd,
  SITE_URL,
} from "./seo";

describe("sayfa metadata sözleşmesi", () => {
  it("self-canonical, sayfaya özgü OG ve Twitter alanlarını birlikte üretir", () => {
    const metadata = createPageMetadata({
      title: "Robotik laboratuvarları",
      description: "Tarayıcıda çalışan robotik deneylerini keşfet.",
      path: "/laboratuvar",
    });

    expect(metadata.alternates?.canonical).toBe("/laboratuvar");
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "https://robotik-platform.vercel.app/laboratuvar",
      title: "Robotik laboratuvarları",
      description: "Tarayıcıda çalışan robotik deneylerini keşfet.",
      images: ["/opengraph-image"],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Robotik laboratuvarları",
      description: "Tarayıcıda çalışan robotik deneylerini keşfet.",
      images: ["/twitter-image"],
    });
  });

  it("arama ve yerel kanıt araçları için noindex üretebilir", () => {
    const metadata = createPageMetadata({
      title: "Yayınlı derslerde ara",
      description: "Robotik derslerinde yerel arama yap.",
      path: "/ara",
      index: false,
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

describe("ders yapılandırılmış verisi", () => {
  it("tek dersi Course rich-result iddiası yerine gerçek LearningResource olarak tanımlar", () => {
    const lesson = getPublishedLessons()[0];
    const jsonLd = lessonJsonLd(lesson, lesson.frontmatter.onkosul);

    expect(jsonLd["@type"]).toBe("LearningResource");
    expect(jsonLd.url).toBe(lessonUrl(lesson.slug));
    expect(jsonLd.name).toBe(lesson.frontmatter.baslik);
    expect(jsonLd.timeRequired).toBe(`PT${lesson.frontmatter.sure}M`);
    expect(jsonLd.teaches).toEqual(lesson.frontmatter.kazanimlar);
    expect(jsonLd.inLanguage).toBe("tr");
  });

  it("koleksiyon sayfalarını görünen bağlantılarla ItemList olarak tanımlar", () => {
    const jsonLd = pageCollectionJsonLd({
      name: "Robotik laboratuvarları",
      description: "Tarayıcıda çalışan robotik deneyleri.",
      path: "/laboratuvar",
      items: [
        { name: "Robot hücresi", path: "/laboratuvar/robot-hucresi" },
        { name: "Arıza Kliniği", path: "/laboratuvar/ariza-klinigi" },
      ],
    });

    expect(jsonLd["@type"]).toBe("CollectionPage");
    expect(jsonLd.mainEntity).toMatchObject({
      "@type": "ItemList",
      numberOfItems: 2,
    });
    expect(jsonLd.mainEntity.itemListElement[1]).toMatchObject({
      "@type": "ListItem",
      position: 2,
      url: "https://robotik-platform.vercel.app/laboratuvar/ariza-klinigi",
      name: "Arıza Kliniği",
    });
  });

  it("uygulamalı laboratuvarı LearningResource olarak işaretler", () => {
    expect(learningResourceJsonLd({
      name: "Robot Hücresi",
      description: "Altı eksenli kolu güvenli biçimde devreye al.",
      path: "/laboratuvar/robot-hucresi",
      learningResourceType: "Etkileşimli laboratuvar",
    })).toMatchObject({
      "@type": "LearningResource",
      url: `${SITE_URL}/laboratuvar/robot-hucresi`,
      isAccessibleForFree: true,
      learningResourceType: "Etkileşimli laboratuvar",
    });
  });
});
