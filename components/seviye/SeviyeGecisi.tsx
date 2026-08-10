import Link from "next/link";
import { SEVIYE_ETIKET, type Seviye } from "@/lib/content";

const SIRA: Seviye[] = ["ortaokul", "lise", "universite"];

/*
 * Seviye anahtarı üç sayfada da var ama üçü farklı görünüyor — bu bilinçli
 * (docs/05: "alttaki etkileşim aynı, üstündeki çerçeveleme seviyeyle
 * ciddileşir"). Ortak olan davranış: aktif seviye bağlantı değil, işaretli
 * bir durum; `aria-current` bunu ekran okuyucuya da söylüyor.
 */
export function SeviyeGecisi({ aktif, bicim }: { aktif: Seviye; bicim: "sticker" | "pill" | "mono" }) {
  if (bicim === "mono") {
    return (
      <div className="flex flex-wrap gap-5 font-mono text-[13px]">
        {SIRA.map((seviye) =>
          seviye === aktif ? (
            <span key={seviye} aria-current="page" className="border-b-2 border-poster-purple-text pb-0.5 text-poster-purple-text">
              {SEVIYE_ETIKET[seviye].toLocaleLowerCase("tr")}
            </span>
          ) : (
            <Link key={seviye} href={`/seviye/${seviye}`} className="inline-flex min-h-11 items-center text-poster-subtle underline-offset-4 hover:text-poster-ink hover:underline">
              {SEVIYE_ETIKET[seviye].toLocaleLowerCase("tr")}
            </Link>
          ),
        )}
      </div>
    );
  }

  if (bicim === "pill") {
    return (
      <div className="flex flex-wrap rounded-2xl bg-poster-soft p-1">
        {SIRA.map((seviye) =>
          seviye === aktif ? (
            <span key={seviye} aria-current="page" className="inline-flex min-h-11 items-center rounded-xl bg-poster-blue px-5 text-sm font-bold text-white">
              {SEVIYE_ETIKET[seviye]}
            </span>
          ) : (
            <Link key={seviye} href={`/seviye/${seviye}`} className="inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-semibold text-poster-muted hover:text-poster-ink">
              {SEVIYE_ETIKET[seviye]}
            </Link>
          ),
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {SIRA.map((seviye) =>
        seviye === aktif ? (
          <span key={seviye} aria-current="page" className="inline-flex min-h-12 items-center rounded-full bg-poster-teal px-6 text-[15px] font-extrabold text-[#0a0a0a] shadow-[4px_4px_0_var(--color-poster-ink)]">
            {SEVIYE_ETIKET[seviye]}
          </span>
        ) : (
          <Link key={seviye} href={`/seviye/${seviye}`} className="inline-flex min-h-12 items-center rounded-full bg-poster-soft px-6 text-[15px] font-bold text-poster-muted hover:text-poster-ink">
            {SEVIYE_ETIKET[seviye]}
          </Link>
        ),
      )}
    </div>
  );
}
