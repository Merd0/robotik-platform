import { getPublicTracksByLevel, hatEtiket, type Seviye } from "@/lib/content";
import { computeTeachingHash } from "@/lib/lessonArtifact";
import { computeLessonContentVersion } from "@/lib/interactionManifest";
import { etkilesimEtiketi } from "@/lib/etkilesimEtiket";
import { CURATED_START_ROUTES } from "@/lib/learningRoutes";
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
  /**
   * `LessonProgressBadge`'e verilen tam sürüm kökü — yalnız `teachingHash`
   * DEĞİL, `computeLessonContentVersion` (teaching+interaction+predicate).
   * Ders sayfası (`app/ders/[slug]/page.tsx`) `LessonEvidenceProvider`ı bu
   * kökle besliyor; buradaki rozetler bare `teachingHash` kullansaydı
   * kaydedilen olayların `contentVersion`'ıyla asla eşleşmez, rozet hep
   * "Başlanmadı" görünürdü (FAZ 2'de bir e2e testiyle yakalandı).
   */
  contentVersion: string;
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
  baslangicRotasi: DersKarti[];
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
          contentVersion: computeLessonContentVersion(lesson.slug, lesson.body, computeTeachingHash(lesson)),
        };
      }),
    }));

  const dersBySlug = new Map(hatlar.flatMap((hat) => hat.dersler).map((ders) => [ders.slug, ders]));
  const baslangicRotasi = CURATED_START_ROUTES[seviye].map((slug) => {
    const ders = dersBySlug.get(slug);
    if (!ders) throw new Error(`Başlangıç rotasındaki ders yayımlı değil: ${slug}`);
    return ders;
  });

  return {
    hatlar,
    dersSayisi: hatlar.reduce((toplam, hat) => toplam + hat.dersler.length, 0),
    baslangicRotasi,
  };
}
