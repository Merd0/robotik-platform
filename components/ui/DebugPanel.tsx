/**
 * Gizli, açılabilir geliştirici paneli (docs/16-urun-denetimi.md Madde 55).
 *
 * Madde 55'in ayrımı: bir laboratuvarın PEDAGOJİK içeriği (ör. DlsTraceLab'ın
 * iterasyon/hata tablosu) her zaman açık kalır — o dersin kendisidir, "debug"
 * değildir. Bu bileşen ayrı bir eksen: solver'ın kendi iç YAPILANDIRMASI
 * (damping, tolerans, maksimum iterasyon, worker limiti gibi) — normal
 * kullanıcının görmek ZORUNDA olmadığı, meraklı/geliştirici bir kullanıcının
 * "bu gerçekten ne hesaplıyor" diye açabildiği ham parametre listesi.
 *
 * Native `<details>` kullanılıyor: JS state gerektirmez, klavyeyle
 * `Enter`/`Space` ile açılır, ekran okuyucu `aria-expanded`i otomatik taşır.
 * Varsayılan KAPALI — bu yüzden "gizli", `open` prop'u yok.
 */
export function DebugPanel({
  items,
  label = "Geliştirici ayrıntıları",
  className = "",
}: {
  items: readonly { label: string; value: string }[];
  label?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <details className={`rounded-lg border border-dashed border-site-border bg-site-bg text-xs ${className}`}>
      <summary className="min-h-11 cursor-pointer select-none px-3 py-2 font-mono font-semibold text-site-muted">
        {label}
      </summary>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 px-3 pb-3 font-mono text-site-ink">
        {items.map((item) => (
          <div key={item.label} className="contents">
            <dt className="text-site-subtle">{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
