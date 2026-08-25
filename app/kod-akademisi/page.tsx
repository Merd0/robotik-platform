import type { Metadata } from "next";
import Link from "next/link";
import { ASAMA_ETIKET, getPublicModulesByAsama, KOD_AKADEMISI_ASAMALAR } from "@/lib/kodAkademisi";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Kod Akademisi",
  description: "Python'u sıfırdan, robotikle, aşama aşama öğren — gözlemden yazmaya.",
  path: "/kod-akademisi",
});

const ASAMA_ACIKLAMA: Record<(typeof KOD_AKADEMISI_ASAMALAR)[number], string> = {
  temel: "Hiç kod yazmadın mı? Buradan başla. Hazır kodu çalıştır, küçük değerler değiştir.",
  orta: "Döngü, koşul, liste. Küçük boşlukları doldur.",
  ileri: "Fonksiyon tanımla, birden fazla kavramı birleştir.",
  usta: "Sıfırdan yaz. Görev tarif edilir, sen çözersin.",
};

export default function KodAkademisiPage() {
  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Kod Akademisi</p>
        <h1 className="mt-3 max-w-2xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Python&apos;u robotikle öğren, baştan sona.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-site-muted">
          Ders yok, kavram anlatımı değil — kodlama becerisi. Dört aşama, her biri
          bir öncekinin üstüne kurulu.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {KOD_AKADEMISI_ASAMALAR.map((asama) => {
            const modules = getPublicModulesByAsama(asama);
            return (
              <Link
                key={asama}
                href={`/kod-akademisi/${asama}`}
                className="flex min-h-11 flex-col gap-2 rounded-2xl border border-site-border bg-site-surface p-5 hover:bg-site-soft"
              >
                <span className="font-heading text-2xl font-semibold text-site-ink">{ASAMA_ETIKET[asama]}</span>
                <span className="text-sm text-site-muted">{ASAMA_ACIKLAMA[asama]}</span>
                <span className="mt-2 font-mono text-xs text-site-accent-text">
                  {modules.length > 0 ? `${modules.length} modül` : "Yakında"}
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/kod-akademisi/gecis-parametre-transferi"
          className="mt-4 flex min-h-11 flex-col gap-2 rounded-2xl border-2 border-site-border bg-site-surface p-5 hover:bg-site-soft"
        >
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Temel → Orta geçiş kapısı</span>
          <span className="font-heading text-2xl font-semibold text-site-ink">Aynı komutu farklı hedefe genelle</span>
          <span className="text-sm text-site-muted">
            Parametreleri kullanmayan bir fonksiyonu düzelt, sonra görmediğin bir hedefe de
            genellediğini kanıtla.
          </span>
        </Link>

        <Link
          href="/kod-akademisi/gecis-kapisi"
          className="mt-4 flex min-h-11 flex-col gap-2 rounded-2xl border-2 border-site-border bg-site-surface p-5 hover:bg-site-soft"
        >
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">İleri → Usta geçiş kapısı</span>
          <span className="font-heading text-2xl font-semibold text-site-ink">Satırdan poza: izle, tahmin et, düzelt</span>
          <span className="text-sm text-site-muted">
            Bir satırlık hatayı çalışma iziyle bul, düzelt — sonra görmediğin bir hedefe de
            genellediğini kanıtla.
          </span>
        </Link>

        <Link
          href="/kod-akademisi/uzmanlik-cerceve-zinciri"
          className="mt-4 flex min-h-11 flex-col gap-2 rounded-2xl border-2 border-site-border bg-site-surface p-5 hover:bg-site-soft"
        >
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Usta sonrası uzmanlık stüdyosu</span>
          <span className="font-heading text-2xl font-semibold text-site-ink">Çerçeve zincirini birleştir</span>
          <span className="text-sm text-site-muted">
            Taban-dünya dönüşümünü doğru sırayla birleştir — Hat A&apos;daki homojen dönüşüm
            dersinin kodda çalışan hâli.
          </span>
        </Link>

        <Link
          href="/kod-akademisi/kapanis"
          className="mt-4 flex min-h-11 flex-col gap-2 rounded-2xl border-2 border-site-strong bg-site-surface p-5 hover:bg-site-soft"
        >
          <span className="text-xs font-semibold uppercase tracking-[.14em] text-site-accent-text">Usta ötesi kapanış projesi</span>
          <span className="font-heading text-2xl font-semibold text-site-ink">Esnek Hücreyi Devreye Al</span>
          <span className="text-sm text-site-muted">
            Dört aşamayı bitirdikten sonra: iş emri doğrulayan, durum makinesi kuran, arızayı
            toparlayan TEK bir mühendislik projesi — altı teslim taşı aynı dosyayı büyütür.
          </span>
        </Link>
      </div>
    </main>
  );
}
