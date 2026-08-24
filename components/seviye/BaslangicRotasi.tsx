import Link from "next/link";
import { LessonProgressBadge } from "@/components/ui/LessonProgressBadge";
import type { Seviye } from "@/lib/content";
import type { DersKarti } from "./seviyeVerisi";

export function BaslangicRotasi({ seviye, dersler }: { seviye: Seviye; dersler: readonly DersKarti[] }) {
  return (
    <section aria-labelledby="baslangic-rotasi-baslik" className="mt-12 rounded-[1.25rem] border-2 border-poster-line bg-poster-surface p-5 sm:p-7">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-poster-purple-text">Elle seçilmiş rota · 3 ders</p>
      <h2 id="baslangic-rotasi-baslik" className="mt-1 font-heading text-3xl font-extrabold">Güvenilir bir başlangıç</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-poster-muted">
        Nereden başlayacağına karar veremiyorsan bu üç dersi sırayla izle. Bu küçük rota elle seçildi; tüm müfredatı otomatik sıralayan bir öneri değildir.
      </p>

      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {dersler.map((ders, index) => (
          <li key={ders.slug} className="relative">
            <Link href={`/ders/${ders.slug}`} className="group flex h-full min-h-36 flex-col rounded-xl border border-poster-line bg-poster-soft p-4 transition hover:-translate-y-0.5 hover:border-poster-ink">
              <span className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold text-poster-subtle">{index + 1} / 3</span>
                <span className="rounded-full border border-poster-line bg-poster-surface px-2.5 py-1">
                  <LessonProgressBadge slug={ders.slug} seviye={seviye} contentVersion={ders.contentVersion} />
                </span>
              </span>
              <strong className="mt-3 font-heading text-xl leading-tight">{ders.baslik}</strong>
              <span className="mt-auto pt-3 text-sm font-bold text-poster-purple-text">
                Dersi aç <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
