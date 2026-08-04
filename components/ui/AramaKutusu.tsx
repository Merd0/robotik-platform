"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { aramaYap, indeksHazirla, type AramaKaydi, type AramaKaydiHam } from "@/lib/arama";

type YuklemeDurumu = "bekliyor" | "yukleniyor" | "hazir" | "hata";

/**
 * Ders araması. İndeks (`public/arama-index.json`) derleme zamanında üretilir
 * ve burada tembel yüklenir — docs/05'teki "ilk yükleme JS < 200 KB" bütçesi
 * bozulmasın diye JS bundle'ına gömülmüyor.
 */
export function AramaKutusu() {
  const [sorgu, setSorgu] = useState("");
  const [indeks, setIndeks] = useState<AramaKaydi[]>([]);
  const [durum, setDurum] = useState<YuklemeDurumu>("bekliyor");
  const istendi = useRef(false);

  // Kullanıcı yazmaya başlayana kadar hiç indirilmez.
  useEffect(() => {
    if (sorgu.trim().length === 0 || istendi.current) return;
    istendi.current = true;
    setDurum("yukleniyor");

    fetch("/arama-index.json")
      .then((yanit) => {
        if (!yanit.ok) throw new Error(String(yanit.status));
        return yanit.json() as Promise<AramaKaydiHam[]>;
      })
      .then((ham) => {
        setIndeks(indeksHazirla(ham));
        setDurum("hazir");
      })
      .catch(() => setDurum("hata"));
  }, [sorgu]);

  const sonuclar = useMemo(
    () => (durum === "hazir" ? aramaYap(indeks, sorgu) : []),
    [durum, indeks, sorgu],
  );

  const aranan = sorgu.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="arama-girdisi" className="text-sm text-ortaokul-ink/70">
          Ders ara — başlıkta ve ders metninde arar. Türkçe karakter yazmasan da bulur.
        </label>
        <input
          id="arama-girdisi"
          type="search"
          value={sorgu}
          onChange={(olay) => setSorgu(olay.target.value)}
          placeholder="örnek: tekillik, ölçüm, güvenli bölge"
          autoComplete="off"
          className="min-h-11 rounded-lg border border-ortaokul-ink/20 bg-ortaokul-surface px-4 py-2 text-ortaokul-ink outline-offset-2 focus-visible:outline-2 focus-visible:outline-ortaokul-accent"
        />
      </div>

      <p role="status" aria-live="polite" className="text-sm text-ortaokul-ink/70">
        {!aranan && "Aramak için bir şeyler yaz."}
        {aranan && durum === "yukleniyor" && "Arama indeksi yükleniyor…"}
        {aranan && durum === "hata" && "Arama indeksi yüklenemedi. Sayfayı yenilemeyi dene."}
        {aranan && durum === "hazir" && `${sonuclar.length} ders bulundu.`}
      </p>

      {sonuclar.length > 0 && (
        <ul className="flex flex-col gap-4">
          {sonuclar.map(({ kayit, parca }) => (
            <li key={kayit.id} className="rounded-lg border border-ortaokul-ink/10 p-4">
              <Link
                href={`/ders/${kayit.id}`}
                className="text-ortaokul-accent-text underline decoration-2 underline-offset-4"
              >
                {kayit.baslik}
              </Link>
              <p className="mt-1 text-xs text-ortaokul-ink/70">
                {kayit.hatEtiket} · {kayit.seviyeEtiket} · {kayit.sure} dk
              </p>
              <p className="mt-2 text-sm text-ortaokul-ink/80">{parca}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
