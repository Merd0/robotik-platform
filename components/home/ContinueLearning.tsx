"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EMPTY_EVIDENCE, getEvidenceEvents, subscribeEvidence } from "@/lib/evidence";
import { getContinueState, type ContinueLesson, type ContinueRoute } from "@/lib/continueLearning";

/**
 * Rota adımlarındaki (routes prop'u, ~9 ders) dersler her zaman bilinir —
 * fetch tamamlanmadan önce "son yer" o adımlardan biriyse panel yine de
 * doğru gösterilir. Kaydın son olayı rota dışı bir dersteyse (89 dersin
 * geri kalanı), tam çözümleme yalnız `/devam-index.json` indikten sonra
 * mümkün olur — bkz. scripts/build-continue-index.ts.
 */
function routeLessons(routes: readonly ContinueRoute[]): ContinueLesson[] {
  return routes.flatMap((route) => route.steps);
}

export function ContinueLearning({ routes }: { routes: readonly ContinueRoute[] }) {
  const events = useSyncExternalStore(subscribeEvidence, getEvidenceEvents, () => EMPTY_EVIDENCE);
  const [devamIndeksi, setDevamIndeksi] = useState<readonly ContinueLesson[] | null>(null);
  const istendi = useRef(false);

  // Kaydı olmayan (ilk kez gelen) ziyaretçi hiçbir zaman bu dosyayı indirmez —
  // aşağıdaki koşul olmadan her ana sayfa yüklemesinde 89 dersin tamamı inerdi,
  // tam da app/page.tsx'teki eski prop mimarisinin ürettiği israfı geri getirirdi.
  useEffect(() => {
    if (events.length === 0 || istendi.current) return;
    istendi.current = true;
    fetch("/devam-index.json")
      .then((yanit) => (yanit.ok ? (yanit.json() as Promise<ContinueLesson[]>) : Promise.reject(yanit.status)))
      .then((data) => setDevamIndeksi(data))
      .catch(() => setDevamIndeksi([]));
  }, [events.length]);

  const lessons = devamIndeksi ?? routeLessons(routes);
  const state = getContinueState(events, lessons);
  if (!state) return null;

  return (
    <section
      data-testid="continue-learning"
      aria-labelledby="devam-baslik"
      className="rounded-[1.25rem] border-[3px] border-poster-ink bg-poster-surface p-6 shadow-[7px_7px_0_var(--color-poster-ink)] sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-poster-teal-text">Yerel deney kaydı bulundu</p>
          <h2 id="devam-baslik" className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl">Kaldığın yerden devam et</h2>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-poster-subtle">Son anlamlı yer</p>
          <Link href={`/ders/${state.lastLesson.slug}`} className="mt-1 inline-flex min-h-11 items-center font-heading text-xl font-bold underline decoration-2 underline-offset-4">
            {state.lastLesson.baslik}
          </Link>
          <p className="text-sm text-poster-muted">{state.lastLesson.seviyeEtiketi} · {state.lastEventLabel}</p>
        </div>

        <div className="rounded-2xl bg-poster-soft p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-poster-purple-text">Önerilen tek sonraki adım</p>
          <h3 className="mt-2 font-heading text-2xl font-extrabold">{state.recommendation.baslik}</h3>
          <p className="mt-1 text-sm leading-6 text-poster-muted">{state.recommendation.detail}</p>
          <Link href={state.recommendation.href} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-poster-ink px-5 py-2 text-sm font-extrabold text-poster-bg">
            Devam et <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
