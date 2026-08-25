import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SEVIYE_ETIKET, type Seviye } from "@/lib/content";
import { seviyeVerisi } from "@/components/seviye/seviyeVerisi";
import { LiseSeviyesi } from "@/components/seviye/LiseSeviyesi";
import { OrtaokulSeviyesi } from "@/components/seviye/OrtaokulSeviyesi";
import { UniversiteSeviyesi } from "@/components/seviye/UniversiteSeviyesi";
import { createPageMetadata, pageCollectionJsonLd } from "@/lib/seo";

const VALID_SEVIYELER: Seviye[] = ["ortaokul", "lise", "universite"];
const LEVEL_DESCRIPTIONS: Record<Seviye, string> = {
  ortaokul: "Robotların nasıl hareket ettiğini oyun hissi veren etkileşimli Türkçe derslerle keşfet.",
  lise: "Koordinat sistemleri, kinematik, planlama ve robot programlamayı etkileşimli Türkçe deneylerle öğren.",
  universite: "DH, Jacobian, ters kinematik, yol planlama ve endüstriyel robotiği kaynaklı laboratuvarlarla derinleştir.",
};

export function generateStaticParams() {
  return VALID_SEVIYELER.map((seviye) => ({ seviye }));
}

export async function generateMetadata({ params }: { params: Promise<{ seviye: string }> }): Promise<Metadata> {
  const { seviye } = await params;
  if (!VALID_SEVIYELER.includes(seviye as Seviye)) return {};
  const level = seviye as Seviye;
  const title = `${SEVIYE_ETIKET[level]} robotik laboratuvarı`;
  return createPageMetadata({ title, description: LEVEL_DESCRIPTIONS[level], path: `/seviye/${level}` });
}

/*
 * Üç seviye tek düzenle değil, üç ayrı düzenle sunuluyor. Gerekçe docs/05
 * Bölüm 1: alttaki etkileşim aynı kalır ama çerçeveleme seviyeyle
 * ciddileşir — ortaokul oyun, lise keşif, üniversite referans gibi durur.
 * Veri hazırlığı ortak (seviyeVerisi), farklı olan yalnız sunum; böylece
 * "ortaokulda gösterilen ders sayısı ile lisedekinin farklı hesaplanması"
 * türü sapma mümkün değil.
 */
export default async function SeviyePage({ params }: { params: Promise<{ seviye: string }> }) {
  const { seviye } = await params;
  if (!VALID_SEVIYELER.includes(seviye as Seviye)) notFound();
  const level = seviye as Seviye;
  const veri = seviyeVerisi(level);
  const jsonLd = pageCollectionJsonLd({
    name: `${SEVIYE_ETIKET[level]} robotik laboratuvarı`,
    description: LEVEL_DESCRIPTIONS[level],
    path: `/seviye/${level}`,
    items: veri.hatlar.flatMap((track) => track.dersler.map((lesson) => ({
      name: lesson.baslik,
      path: `/ders/${lesson.slug}`,
    }))),
  });
  const LevelComponent = level === "ortaokul"
    ? OrtaokulSeviyesi
    : level === "lise"
      ? LiseSeviyesi
      : UniversiteSeviyesi;

  return (
    <>
      <JsonLd data={jsonLd} />
      <LevelComponent veri={veri} />
    </>
  );
}
