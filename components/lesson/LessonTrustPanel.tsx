import type { Lesson, SourceRef } from "@/lib/content";
import { hatEtiket, SEVIYE_ETIKET } from "@/lib/content";
import { getLessonReviewStatus, REVIEW_SCOPE_LABELS } from "@/lib/reviewReceipts";

function kaynakGoster(kaynak: string | SourceRef) {
  if (typeof kaynak !== "string") {
    const label = [kaynak.publisher, kaynak.title, kaynak.version].filter(Boolean).join(" · ");
    const detail = kaynak.accessedAt ? ` (erişim: ${kaynak.accessedAt})` : "";
    if (!kaynak.url) return `${label}${detail}`;
    return <a href={kaynak.url} rel="noreferrer" target="_blank" className="underline decoration-site-border underline-offset-4 hover:text-site-accent-text">{label}{detail}</a>;
  }
  const url = kaynak.match(/https?:\/\/[^\s)]+/)?.[0];
  if (!url) return kaynak;
  return <a href={url} rel="noreferrer" target="_blank" className="underline decoration-site-border underline-offset-4 hover:text-site-accent-text">{kaynak}</a>;
}

export function LessonTrustPanel({ lesson }: { lesson: Lesson }) {
  const { frontmatter } = lesson;
  const reviewStatus = getLessonReviewStatus(lesson);
  const verified = reviewStatus.state === "verified";
  return (
    <aside className="lab-panel p-5 lg:sticky lg:top-24" aria-labelledby="guven-paneli-baslik">
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
        <p className={`mt-3 rounded-xl border p-3 text-xs leading-5 ${verified ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`} data-review-state={reviewStatus.state}>
          <strong className="block">{reviewStatus.label}</strong>
          <span className="mt-1 block">{reviewStatus.explanation}</span>
          {reviewStatus.latestReceipt ? (
            <span className="mt-2 block">Son inceleme: {reviewStatus.latestReceipt.reviewer.displayName} · {reviewStatus.latestReceipt.reviewedAt}</span>
          ) : (frontmatter.incelendi_tarafindan || frontmatter.incelendi_tarih) && (
            <span className="mt-2 block">
              Eski kayıt: {frontmatter.incelendi_tarafindan ?? "kişi belirtilmemiş"}
              {frontmatter.incelendi_tarih ? ` · ${frontmatter.incelendi_tarih}` : ""}
            </span>
          )}
        </p>
        <ul className="mt-3 grid gap-1 text-[11px] text-site-subtle" aria-label="İnceleme kapsamları">
          {reviewStatus.scopeStatuses.map((scope) => (
            <li key={scope.scope} className="flex items-center justify-between gap-3" data-scope={scope.scope} data-scope-state={scope.state}>
              <span>{REVIEW_SCOPE_LABELS[scope.scope]}</span>
              <span className={scope.state === "verified" ? "text-success-ink" : "text-warning-ink"}>{scope.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-4 text-site-subtle">
          Ders metni sürümü <span className="font-mono">{reviewStatus.hashes.teachingHash.replace("sha256:", "").slice(0, 12)}</span>.
          İnceleme bu sürüme bağlanır; dersi yayına almak veya süresini düzeltmek incelemeyi geçersiz kılmaz.
        </p>
      </div>
      <p className="mt-4 text-[11px] leading-4 text-site-subtle">Hesaplar tarayıcında çalışır. Ders ilerlemesi sunucuya gönderilmez; bu cihazda tutulur.</p>
    </aside>
  );
}
