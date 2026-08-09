"use client";

import { StatePage } from "@/components/ui/StatePage";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatePage
      eyebrow="Deney kesildi"
      title="Bu sahne tamamlanamadı."
      body="Yerel deney durumu korunmaya çalışıldı. Aynı adımı yeniden başlatabilir veya ana laboratuvara dönebilirsin."
    >
      <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-site-strong px-4 py-2 text-sm font-semibold text-site-on-strong">
        Yeniden dene
      </button>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-site-border px-4 py-2 text-sm font-semibold text-site-ink">
        Ana laboratuvara dön
      </Link>
    </StatePage>
  );
}
