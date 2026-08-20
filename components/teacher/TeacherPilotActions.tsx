"use client";

import { useState } from "react";

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
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

export function TeacherPilotActions({ taskUrl, showPrint = true }: { taskUrl: string; showPrint?: boolean }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copyTaskUrl() {
    try {
      await copyText(taskUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copyTaskUrl}
        className="inline-flex min-h-11 items-center rounded-xl bg-site-ink px-4 py-2 text-sm font-semibold text-site-surface"
      >
        Görev bağlantısını kopyala
      </button>
      {showPrint && (
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center rounded-xl border border-site-border bg-site-surface px-4 py-2 text-sm font-semibold text-site-ink"
        >
          Çalışma kâğıdını yazdır
        </button>
      )}
      <p role="status" aria-live="polite" className="text-xs text-site-muted">
        {copyStatus === "copied"
          ? "Bağlantı panoya kopyalandı."
          : copyStatus === "error"
            ? "Pano kullanılamadı; aşağıdaki bağlantıyı elle kopyalayabilirsin."
            : showPrint
              ? "İki işlem de yalnız bu tarayıcıda gerçekleşir."
              : "Kopyalama yalnız bu tarayıcıda gerçekleşir."}
      </p>
    </div>
  );
}
