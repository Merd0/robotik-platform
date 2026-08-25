import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, learningResourceJsonLd } from "@/lib/seo";
import Link from "next/link";
import { FaultInjectionLab } from "@/components/lab/FaultInjectionLab";

export const metadata: Metadata = createPageMetadata({
  title: "Arıza Kliniği — robot arızası teşhis laboratuvarı",
  description: "Encoder bias, paket gecikmesi ve aktüatör doygunluğunu deterministik telemetriyle teşhis et; güvenli ilk eylemi seç.",
  path: "/laboratuvar/ariza-klinigi",
});

export default function FaultClinicPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <JsonLd data={learningResourceJsonLd({ name: "Arıza Kliniği", description: "Encoder bias, paket gecikmesi ve aktüatör doygunluğunu deterministik telemetriyle teşhis et; güvenli ilk eylemi seç.", path: "/laboratuvar/ariza-klinigi", learningResourceType: "Etkileşimli laboratuvar" })} />
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
          <Link href="/laboratuvar" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvarlar</Link>
          <span aria-hidden="true">/</span>
          Arıza Kliniği
        </nav>
        <header className="mt-8 max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Arıza enjeksiyonu · güvenli teşhis</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Semptomu izle, arızayı güvenle teşhis et.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-site-muted">İdeal yol yerine bozulan sistemi gör. Arıza türü gizlidir: hangi telemetriyi açacağına, hangi kök nedeni savunacağına ve belirsizlik sürerken önce neyi güvenli duruma alacağına sen karar verirsin.</p>
        </header>
        <div className="mt-10"><FaultInjectionLab /></div>
        <section className="mt-10 max-w-4xl rounded-2xl border border-site-border bg-site-surface p-6" aria-labelledby="lab-nasil-calisir">
          <h2 id="lab-nasil-calisir" className="font-heading text-2xl font-semibold text-site-ink">Bu laboratuvar neyi öğretiyor?</h2>
          <p className="mt-3 text-base leading-7 text-site-muted">Aynı sapma farklı kök nedenlerden gelebilir. Bu yüzden yalnız grafiğe isim vermek yetmez: önce riski büyütmeyen eylemi seçmek, sonra hipotezi gerçekten ayırt eden ölçümü istemek gerekir. Vaka seed’i ve trace motoru deterministiktir; aynı vaka aynı sayıları üretir.</p>
        </section>
      </div>
    </main>
  );
}
