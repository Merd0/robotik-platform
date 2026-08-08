import Link from "next/link";
import { StatePage } from "@/components/ui/StatePage";

export default function NotFound() {
  return (
    <StatePage
      eyebrow="Rota bulunamadı · 404"
      title="Bu deney production haritasında yok."
      body="Adres yanlış olabilir veya aradığın ders hâlâ taslak olduğu için herkese açık çıktıya alınmamış olabilir."
    >
      <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-site-strong px-4 py-2 text-sm font-semibold text-site-on-strong">
        Ana laboratuvara dön
      </Link>
      <Link href="/ara" className="inline-flex min-h-11 items-center rounded-xl border border-site-border px-4 py-2 text-sm font-semibold text-site-ink">
        Yayınlı derslerde ara
      </Link>
    </StatePage>
  );
}
