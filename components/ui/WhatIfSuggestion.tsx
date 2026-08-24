/**
 * "Ya şunu denesen?" önerisi (docs/16-urun-denetimi.md Madde 30).
 *
 * Madde 30'un tespiti: birçok laboratuvarda parametre değiştirmek zaten
 * mümkün (kaydırıcı, sürükleme) ama sistem kullanıcıya SPESİFİK bir soru
 * sormuyor — kullanıcı kendiliğinden "ya şunu denesem" diye düşünmek
 * zorunda. Bu bileşen yeni bir hesap/motor icat etmez: çağıran laboratuvar
 * kendi var olan state setter'ını `onApply` içine verir, gerçek sonucu
 * (reachable/unreachable, çarpışma vb.) laboratuvarın zaten sahip olduğu
 * görselleştirme gösterir. Bileşenin tek işi soruyu ÇERÇEVELEMEK.
 */
export function WhatIfSuggestion({
  question,
  actionLabel = "Dene",
  onApply,
  className = "",
}: {
  question: string;
  actionLabel?: string;
  onApply: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-site-border bg-site-soft p-3 text-sm ${className}`}
    >
      <p className="text-site-ink">
        <span className="font-semibold text-site-accent-text">Ya şunu denesen? </span>
        {question}
      </p>
      <button
        type="button"
        onClick={onApply}
        className="min-h-11 shrink-0 rounded-lg border border-site-border bg-site-surface px-3 text-sm font-semibold text-site-ink"
      >
        {actionLabel}
      </button>
    </div>
  );
}
