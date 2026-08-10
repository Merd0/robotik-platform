import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SEVIYE_ETIKET, type Seviye } from "@/lib/content";
import { seviyeVerisi } from "@/components/seviye/seviyeVerisi";
import { LiseSeviyesi } from "@/components/seviye/LiseSeviyesi";
import { OrtaokulSeviyesi } from "@/components/seviye/OrtaokulSeviyesi";
import { UniversiteSeviyesi } from "@/components/seviye/UniversiteSeviyesi";

const VALID_SEVIYELER: Seviye[] = ["ortaokul", "lise", "universite"];

export function generateStaticParams() {
  return VALID_SEVIYELER.map((seviye) => ({ seviye }));
}

export async function generateMetadata({ params }: { params: Promise<{ seviye: string }> }): Promise<Metadata> {
  const { seviye } = await params;
  if (!VALID_SEVIYELER.includes(seviye as Seviye)) return {};
  return { title: `${SEVIYE_ETIKET[seviye as Seviye]} laboratuvarı` };
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

  if (level === "ortaokul") return <OrtaokulSeviyesi veri={veri} />;
  if (level === "lise") return <LiseSeviyesi veri={veri} />;
  return <UniversiteSeviyesi veri={veri} />;
}
