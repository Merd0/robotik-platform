import type { ReactNode } from "react";

export function StatePage({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <main id="ana-icerik" className="min-h-[70vh] px-4 py-16 sm:px-6 sm:py-24">
      <section className="lab-panel mx-auto max-w-2xl overflow-hidden" aria-labelledby="durum-baslik">
        <div className="border-b border-site-border bg-slate-950 p-5 text-white">
          <p className="font-mono text-xs uppercase tracking-[.16em] text-teal-300">{eyebrow}</p>
          <svg viewBox="0 0 420 82" className="mt-4 h-20 w-full" role="img" aria-label="Başlangıçtan hedefe ilerleyen kesintili robot uç noktası izi">
            <path d="M8 63 C86 4 150 77 225 36 S340 9 412 48" fill="none" stroke="#5eead4" strokeWidth="3" strokeDasharray="7 7" />
            <circle cx="8" cy="63" r="5" fill="#f97316" />
            <circle cx="412" cy="48" r="7" fill="none" stroke="#f8fafc" strokeWidth="2" />
          </svg>
        </div>
        <div className="p-6 sm:p-8">
          <h1 id="durum-baslik" className="font-heading text-3xl font-semibold tracking-tight text-site-ink">{title}</h1>
          <p className="mt-3 max-w-xl leading-7 text-site-muted">{body}</p>
          {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
        </div>
      </section>
    </main>
  );
}
