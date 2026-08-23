"use client";

import { useComplexityMode } from "./ComplexityModeProvider";

/**
 * Yalnız `supported` true iken görünür — Öğren/Mühendislik ayrımını
 * gerçekten destekleyen en az bir laboratuvar sayfada monteliyse (bkz.
 * `useDeclareComplexityModeSupport`). Diğer ~90 ders sayfasında hiçbir şey
 * göstermez: hiçbir şeyi değiştirmeyen bir kontrol kafa karıştırırdı.
 */
export function ComplexityModeToggle() {
  const { mode, setMode, supported } = useComplexityMode();
  if (!supported) return null;

  const engineering = mode === "engineering";
  const label = engineering ? "Öğren moduna geç" : "Mühendislik moduna geç";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setMode(engineering ? "learn" : "engineering")}
      className="grid size-11 shrink-0 place-items-center rounded-lg border border-site-border text-site-muted transition hover:bg-site-soft hover:text-site-ink"
    >
      {engineering ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 19.5V6a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v13.5" />
          <path d="M4 19.5h12.5a2 2 0 0 0 2-2V17" />
          <path d="M8 8h6M8 11.5h6" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="2.6" />
          <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8 6.2 6.2" />
        </svg>
      )}
    </button>
  );
}
