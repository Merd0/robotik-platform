"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Seviye } from "@/lib/content";
import { decodeLabState, encodeLabState, type LabState } from "@/lib/labState";

export interface ChallengeMetric {
  label: string;
  value: string;
}

const THEME = {
  ortaokul: {
    border: "border-ortaokul-accent/40",
    bg: "bg-ortaokul-bg",
    surface: "bg-ortaokul-surface",
    ink: "text-ortaokul-ink",
    muted: "text-ortaokul-ink/75",
    accent: "text-ortaokul-accent-text",
    active: "border-ortaokul-ink bg-ortaokul-ink text-ortaokul-surface",
    inactive: "border-ortaokul-accent bg-ortaokul-surface text-ortaokul-ink",
  },
  lise: {
    border: "border-lise-accent/40",
    bg: "bg-lise-bg",
    surface: "bg-lise-surface",
    ink: "text-lise-ink",
    muted: "text-lise-ink/75",
    accent: "text-lise-accent-text",
    active: "border-lise-ink bg-lise-ink text-lise-surface",
    inactive: "border-lise-accent bg-lise-surface text-lise-ink",
  },
  universite: {
    border: "border-universite-accent/35",
    bg: "bg-universite-bg",
    surface: "bg-universite-surface",
    ink: "text-universite-ink",
    muted: "text-universite-ink/75",
    accent: "text-universite-accent-text",
    active: "border-universite-ink bg-universite-ink text-universite-surface",
    inactive: "border-universite-accent bg-universite-surface text-universite-ink",
  },
} as const;

export function ChallengeHeader({
  seviye,
  active,
  eyebrow,
  title,
  description,
  constraints,
  onToggle,
}: {
  seviye: Seviye;
  active: boolean;
  eyebrow: string;
  title: string;
  description: string;
  constraints: readonly string[];
  onToggle: () => void;
}) {
  const detailsId = useId();
  const theme = THEME[seviye];

  return (
    <div className={`mb-4 rounded-xl border p-4 ${theme.border} ${theme.bg} ${theme.ink}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className={`text-xs font-bold uppercase tracking-[.14em] ${theme.accent}`}>{eyebrow}</p>
          <h3 className="mt-1 font-heading text-lg font-bold">{title}</h3>
          <p id={detailsId} className={`mt-1 text-sm leading-6 ${theme.muted}`}>{description}</p>
        </div>
        <button
          type="button"
          aria-pressed={active}
          aria-describedby={detailsId}
          onClick={onToggle}
          className={`min-h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold ${active ? theme.active : theme.inactive}`}
        >
          {active ? "Serbest moda dön" : "Meydan okumayı başlat"}
        </button>
      </div>
      {active && (
        <ul className={`mt-3 grid gap-2 text-sm sm:grid-cols-2 ${theme.muted}`}>
          {constraints.map((constraint, index) => (
            <li key={constraint} className={`flex gap-2 rounded-lg border px-3 py-2 ${theme.border} ${theme.surface}`}>
              <span aria-hidden="true" className={`font-mono text-xs font-bold ${theme.accent}`}>{index + 1}</span>
              <span>{constraint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ChallengeResult({
  seviye,
  title,
  summary,
  metrics,
  onRetry,
}: {
  seviye: Seviye;
  title: string;
  summary: string;
  metrics: readonly ChallengeMetric[];
  onRetry: () => void;
}) {
  const theme = THEME[seviye];

  return (
    <section
      aria-live="polite"
      aria-label="Meydan okuma sonucu"
      className="mt-4 rounded-xl border-2 border-success-border bg-success-surface p-4 text-success-ink"
    >
      <p className="text-xs font-bold uppercase tracking-[.14em]">Doğrulama tamamlandı</p>
      <h3 className="mt-1 font-heading text-xl font-bold">{title}</h3>
      <p className="mt-1 text-sm leading-6">{summary}</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-lg border border-success-border px-3 py-2 ${theme.surface}`}>
            <dt className="text-xs font-semibold uppercase tracking-wide opacity-75">{metric.label}</dt>
            <dd className="mt-1 font-mono text-sm font-bold">{metric.value}</dd>
          </div>
        ))}
      </dl>
      <button type="button" onClick={onRetry} className="mt-3 min-h-11 rounded-lg border border-success-border px-4 text-sm font-semibold">
        Aynı problemi yeniden çalıştır
      </button>
    </section>
  );
}

async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Güvenli bağlam/pano izni yoksa aşağıdaki yerel kopyalama yolunu dene.
    }
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("clipboard-unavailable");
}

export function ExperimentShareButton({
  seviye,
  createShareUrl,
  disabled = false,
  disabledReason,
  buttonLabel = "Bu deneyi paylaş",
  linkLabel = "Paylaşılan görünümü aç",
  idleDescription = "Bağlantı yalnız bu sahnenin durumunu taşır; hesap veya ad içermez.",
}: {
  seviye: Seviye;
  createShareUrl: () => string | null;
  disabled?: boolean;
  disabledReason?: string;
  buttonLabel?: string;
  linkLabel?: string;
  idleDescription?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">("idle");
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const theme = THEME[seviye];

  async function share() {
    const url = createShareUrl();
    if (!url) return;
    setSharedUrl(url);
    setStatus("copying");
    try {
      await copyToClipboard(url);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className={`mt-4 flex flex-wrap items-center gap-3 border-t pt-4 ${theme.border}`}>
      <button
        type="button"
        onClick={share}
        disabled={disabled || status === "copying"}
        className={`min-h-11 rounded-xl border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${theme.border} ${theme.surface} ${theme.ink}`}
      >
        {status === "copying" ? "Bağlantı hazırlanıyor…" : buttonLabel}
      </button>
      <p className={`text-xs ${theme.muted}`} role="status" aria-live="polite">
        {disabled && disabledReason
          ? disabledReason
          : status === "copied"
            ? "Bağlantı panoya kopyalandı."
          : status === "error"
            ? "Pano kullanılamadı; tarayıcı izinlerini kontrol et."
            : idleDescription}
      </p>
      {sharedUrl && (
        <a href={sharedUrl} className={`inline-flex min-h-11 items-center text-xs font-semibold underline underline-offset-4 ${theme.accent}`}>
          {linkLabel}
        </a>
      )}
    </div>
  );
}

type LabStateFor<Kind extends LabState["kind"]> = Extract<LabState, { kind: Kind }>;

/** Motorun kodladığı state'i URL fragment'ına yerleştiren UI katmanı. */
export function createLabShareUrl(state: LabState): string {
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams();
  fragment.set("lab", encodeLabState(state));
  url.hash = fragment.toString();
  return url.toString();
}

/**
 * Paylaşılan fragment'ı motorun decoder'ıyla doğrular ve yalnız beklenen lab
 * türünü bileşene verir. State biçimi veya fiziksel doğrulama burada tekrar
 * edilmez; bu hook yalnız URL ile React state'i arasındaki UI köprüsüdür.
 */
export function useSharedLabState<Kind extends LabState["kind"]>(
  kind: Kind,
  restore: (state: LabStateFor<Kind>) => void,
  onError?: (error: string) => void,
) {
  const restoreRef = useRef(restore);
  const errorRef = useRef(onError);

  useEffect(() => {
    restoreRef.current = restore;
  }, [restore]);

  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    function restoreFromFragment() {
      const encoded = new URLSearchParams(window.location.hash.slice(1)).get("lab");
      if (!encoded) return;
      const decoded = decodeLabState(encoded);
      if (!decoded.ok) {
        errorRef.current?.(`Paylaşım bağlantısı açılamadı: ${decoded.error}`);
        return;
      }
      if (decoded.state.kind !== kind) {
        errorRef.current?.("Paylaşım bağlantısı bu deney alanına ait değil.");
        return;
      }
      restoreRef.current(decoded.state as LabStateFor<Kind>);
    }

    restoreFromFragment();
    window.addEventListener("hashchange", restoreFromFragment);
    return () => window.removeEventListener("hashchange", restoreFromFragment);
  }, [kind]);
}
