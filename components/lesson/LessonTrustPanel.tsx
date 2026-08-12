import type { Lesson, SourceRef } from "@/lib/content";
import { hatEtiket, SEVIYE_ETIKET } from "@/lib/content";
import { getLessonReviewStatus, REVIEW_SCOPE_LABELS } from "@/lib/reviewReceipts";

function kaynakGoster(kaynak: string | SourceRef) {
  if (typeof kaynak !== "string") {
    const label = [kaynak.publisher, kaynak.title, kaynak.version].filter(Boolean).join(" · ");
    const detail = kaynak.accessedAt ? ` (erişim: ${kaynak.accessedAt})` : "";
    if (!kaynak.url) return `${label}${detail}`;
    return <a href={kaynak.url} rel="noreferrer" target="_blank" className="break-words underline decoration-site-border underline-offset-4 hover:text-site-accent-text">{label}{detail}</a>;
  }
  const url = kaynak.match(/https?:\/\/[^\s)]+/)?.[0];
  if (!url) return kaynak;
  return <a href={url} rel="noreferrer" target="_blank" className="break-words underline decoration-site-border underline-offset-4 hover:text-site-accent-text">{kaynak}</a>;
}

export function LessonTrustPanel({ lesson }: { lesson: Lesson }) {
  const { frontmatter } = lesson;
  const reviewStatus = getLessonReviewStatus(lesson);
  const verified = reviewStatus.state === "verified";
  return (
    <aside className="min-w-0 lab-panel p-5 lg:sticky lg:top-24" aria-labelledby="guven-paneli-baslik">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-site-accent-text">Ders kimliği</p>
      <h2 id="guven-paneli-baslik" className="mt-2 font-heading text-lg font-semibold">Ne öğreneceksin, neye dayanıyor?</h2>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-site-soft p-3"><dt className="text-xs text-site-subtle">Süre</dt><dd className="mt-1 font-semibold">{frontmatter.sure} dakika</dd></div>
        <div className="rounded-xl bg-site-soft p-3"><dt className="text-xs text-site-subtle">Seviye</dt><dd className="mt-1 font-semibold">{SEVIYE_ETIKET[frontmatter.seviye]}</dd></div>
        <div className="col-span-2 rounded-xl bg-site-soft p-3"><dt className="text-xs text-site-subtle">Hat</dt><dd className="mt-1 font-semibold">{hatEtiket(frontmatter.hat)}</dd></div>
      </dl>

      <div className="mt-5">
        <h3 className="text-sm font-semibold">Kazanım</h3>
        <ul className="mt-2 space-y-2 text-sm leading-5 text-site-muted">
          {frontmatter.kazanimlar.map((kazanim) => <li key={kazanim} className="flex gap-2"><span aria-hidden="true" className="text-site-accent-text">✓</span><span>{kazanim}</span></li>)}
        </ul>
      </div>

      <div className="mt-5 border-t border-site-border pt-5">
        <h3 className="text-sm font-semibold">Kaynak ve inceleme</h3>
        <ul className="mt-2 space-y-2 text-xs leading-5 text-site-muted">
          {frontmatter.kaynaklar.map((kaynak) => (
            <li key={typeof kaynak === "string" ? kaynak : `${kaynak.kind}:${kaynak.url ?? kaynak.title}`}>
              {kaynakGoster(kaynak)}
            </li>
          ))}
        </ul>
        {/*
          İnsan gözden geçirmesi 2026-08-10'dan beri opsiyonel (docs/06 "Katman 3").
          Bu yüzden makbuzu olmayan ders için uyarı rozeti gösterilmiyor — "inceleme
          bekliyor" demek yanlış bir beklenti üretirdi. Makbuz VARSA gösteriliyor,
          çünkü o zaman söylenecek doğru ve olumlu bir şey var.
        */}
        {verified && reviewStatus.latestReceipt && (
          <p className="mt-3 rounded-xl border border-success-border bg-success-surface p-3 text-xs leading-5 text-success-ink" data-review-state={reviewStatus.state}>
            <strong className="block">Bu sürüm elle incelendi</strong>
            <span className="mt-1 block">
              {reviewStatus.verifiedScopes.map((scope) => REVIEW_SCOPE_LABELS[scope].toLocaleLowerCase("tr")).join(", ")} kapsamlarında
              {" "}{reviewStatus.latestReceipt.reviewer.displayName} · {reviewStatus.latestReceipt.reviewedAt}
            </span>
          </p>
        )}
        <p className="mt-3 text-[11px] leading-4 text-site-subtle">
          Bu dersteki her teknik iddia yukarıdaki kaynaklara dayanır; kaynağı olmayan bilgi yayımlanmaz.
          Bir hata fark edersen <a href="https://github.com/Merd0/robotik-platform/issues" rel="noreferrer" target="_blank" className="underline underline-offset-2">bildirebilirsin</a> — düzeltmeler açık kaynak akışıyla yapılır.
        </p>
      </div>
      <p className="mt-4 text-[11px] leading-4 text-site-subtle">Hesaplar tarayıcında çalışır. Ders ilerlemesi sunucuya gönderilmez; bu cihazda tutulur.</p>
    </aside>
  );
}
