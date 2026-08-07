import type { Lesson } from "@/lib/content";
import { hatEtiket, SEVIYE_ETIKET } from "@/lib/content";

function kaynakGoster(kaynak: string) {
  const url = kaynak.match(/https?:\/\/[^\s)]+/)?.[0];
  if (!url) return kaynak;
  return <a href={url} rel="noreferrer" target="_blank" className="underline decoration-slate-300 underline-offset-4 hover:text-teal-800">{kaynak}</a>;
}

export function LessonTrustPanel({ lesson }: { lesson: Lesson }) {
  const { frontmatter } = lesson;
  return (
    <aside className="lab-panel p-5 lg:sticky lg:top-24" aria-labelledby="guven-paneli-baslik">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-teal-800">Ders kimliği</p>
      <h2 id="guven-paneli-baslik" className="mt-2 font-heading text-lg font-semibold">Ne öğreneceksin, neye dayanıyor?</h2>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Süre</dt><dd className="mt-1 font-semibold">{frontmatter.sure} dakika</dd></div>
        <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Seviye</dt><dd className="mt-1 font-semibold">{SEVIYE_ETIKET[frontmatter.seviye]}</dd></div>
        <div className="col-span-2 rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Hat</dt><dd className="mt-1 font-semibold">{hatEtiket(frontmatter.hat)}</dd></div>
      </dl>

      <div className="mt-5">
        <h3 className="text-sm font-semibold">Kazanım</h3>
        <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-600">
          {frontmatter.kazanimlar.map((kazanim) => <li key={kazanim} className="flex gap-2"><span aria-hidden="true" className="text-teal-700">✓</span><span>{kazanim}</span></li>)}
        </ul>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold">Kaynak ve inceleme</h3>
        <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-600">
          {frontmatter.kaynaklar.map((kaynak) => <li key={kaynak}>{kaynakGoster(kaynak)}</li>)}
        </ul>
        <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
          <strong className="block">İnsan incelemesi: {frontmatter.incelendi_tarafindan ?? "belirtilmemiş"}</strong>
          {frontmatter.incelendi_tarih ? `${frontmatter.incelendi_tarih} · ` : ""}Yayınlanan sürüm
        </p>
      </div>
      <p className="mt-4 text-[11px] leading-4 text-slate-500">Hesaplar tarayıcında çalışır. Ders ilerlemesi sunucuya gönderilmez; bu cihazda tutulur.</p>
    </aside>
  );
}
