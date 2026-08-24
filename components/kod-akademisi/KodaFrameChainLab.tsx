"use client";

import { LazyPythonCodeEditor } from "@/components/interactive/LazyPythonCodeEditor";
import { KODA_FRAME_CHAIN_SENARYOLARI } from "@/lib/kodaFrameChain";
import { useKodaFrameChainLab } from "./useKodaFrameChainLab";

export function KodaFrameChainLab() {
  const { code, setCode, durum, sonuclar, hataMesaji, runAll, reset } = useKodaFrameChainLab();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-3 rounded-xl border border-site-border bg-site-surface p-4">
          <span id="koda-frame-chain-editor-label" className="text-sm font-medium text-site-ink">
            Python kodu
          </span>
          <LazyPythonCodeEditor
            id="koda-frame-chain-editor"
            value={code}
            onChange={setCode}
            error={hataMesaji}
            labelledBy="koda-frame-chain-editor-label"
            tone="site"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runAll}
              disabled={durum === "calisiyor"}
              className="h-11 rounded-md bg-site-strong px-4 text-site-on-strong disabled:opacity-50"
            >
              {durum === "calisiyor" ? "Çalışıyor…" : "Çalıştır"}
            </button>
            <button type="button" onClick={reset} className="h-11 rounded-md border border-site-border px-4 text-site-ink">
              Sıfırla
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-site-border bg-site-surface p-4" role="status" aria-live="polite">
          <span className="text-sm font-medium text-site-ink">Sonuçlar</span>
          {!sonuclar ? (
            <p className="text-sm text-site-muted">Henüz çalıştırılmadı.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sonuclar.map((sonuc, index) => {
                const senaryo = KODA_FRAME_CHAIN_SENARYOLARI[index];
                return (
                  <li
                    key={sonuc.senaryoId}
                    data-testid={`koda-frame-chain-sonuc-${senaryo.id}`}
                    className={`rounded-lg border p-3 text-sm ${sonuc.gecti ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`}
                  >
                    <p className="font-semibold">
                      {sonuc.gecti ? "✓" : "○"} {senaryo.gizli ? "Gizli senaryo (kör transfer)" : "Görünür senaryo"}
                    </p>
                    {!sonuc.gecti && <p className="mt-1 text-xs">{sonuc.gerekce}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
