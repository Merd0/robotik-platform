import { getPublicTracksByLevel, hatEtiket, type Seviye } from "@/lib/content";
import { computeTeachingHash } from "@/lib/lessonArtifact";
import { etkilesimEtiketi } from "@/lib/etkilesimEtiket";
import { kanalKodu, onizlemeTuru, type OnizlemeTuru } from "./LessonPreview";

/*
 * Üç seviye sayfası aynı veriyi farklı görsel dillerde sunuyor. Hazırlığı
 * burada tek yerde yapmak, "ortaokulda gösterilen ders sayısı ile lisede
 * gösterilenin farklı hesaplanması" türü sapmayı imkânsız kılıyor.
 */

export interface DersKarti {
  slug: string;
  baslik: string;
  sure: number;
  ilkKazanim: string;
  etkilesim: string;
  onizleme: OnizlemeTuru;
  kanal: string;
  teachingHash: string;
}

export interface HatBlogu {
  hat: string;
  etiket: string;
  harf: string;
  dersler: DersKarti[];
}

export interface SeviyeVerisi {
  hatlar: HatBlogu[];
  dersSayisi: number;
}

export function seviyeVerisi(seviye: Seviye): SeviyeVerisi {
  const hatlar = getPublicTracksByLevel(seviye)
    .map((track) => ({ ...track, lessons: track.lessons.filter((lesson) => lesson.frontmatter.durum === "yayinda") }))
    .filter((track) => track.lessons.length > 0)
    .map((track, index) => ({
      hat: track.hat,
      etiket: hatEtiket(track.hat),
      harf: String.fromCharCode(65 + index),
      dersler: track.lessons.map((lesson) => {
        const onizleme = onizlemeTuru(lesson.frontmatter.etkilesimli);
        return {
          slug: lesson.slug,
          baslik: lesson.frontmatter.baslik,
          sure: lesson.frontmatter.sure,
          ilkKazanim: lesson.frontmatter.kazanimlar[0] ?? "",
          etkilesim: etkilesimEtiketi(lesson.frontmatter.etkilesimli),
          onizleme,
          kanal: kanalKodu(onizleme),
          teachingHash: computeTeachingHash(lesson),
        };
      }),
    }));

  return { hatlar, dersSayisi: hatlar.reduce((toplam, hat) => toplam + hat.dersler.length, 0) };
}
