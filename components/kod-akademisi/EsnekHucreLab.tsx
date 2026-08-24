"use client";

import { useState } from "react";
import { LazyPythonCodeEditor } from "@/components/interactive/LazyPythonCodeEditor";
import { ESNEK_HUCRE_SENARYOLARI, type EsnekHucreSenaryoDegerlendirmesi } from "@/lib/esnekHucre";
import { useEsnekHucreLab } from "./useEsnekHucreLab";

interface Kilometretasi {
  no: number;
  baslik: string;
  aciklama: string;
  gecti: (sonuclar: readonly EsnekHucreSenaryoDegerlendirmesi[] | null, refactorHazir: boolean) => boolean;
}

const KILOMETRETASLARI: readonly Kilometretasi[] = [
  {
    no: 1,
    baslik: "Şartnameyi yürütülebilir sözleşmeye çevir",
    aciklama: 'Kod hiç çökmeden çalışıyor ve en az bir "hucre.durum_gec(...)" bildirimi üretiyor.',
    gecti: (sonuclar) => Boolean(sonuclar?.[0] && sonuclar[0].durumGecmisi.length > 0),
  },
  {
    no: 2,
    baslik: "İş emrini doğrula",
    aciklama: "Geçersiz parça türü, robot hiç hareket etmeden reddediliyor.",
    gecti: (sonuclar) => Boolean(sonuclar?.[1]?.gecti),
  },
  {
    no: 3,
    baslik: "Durum makinesini kur",
    aciklama: 'idle → ready → running → tamamlandi geçişleri doğru sırayla bildiriliyor.',
    gecti: (sonuclar) => Boolean(sonuclar?.[0]?.gecti),
  },
  {
    no: 4,
    baslik: "Hareket politikasını uygula",
    aciklama: "Farklı sayıda/türde hedef içeren yeni bir iş emrine de doğru genelliyor.",
    gecti: (sonuclar) => Boolean(sonuclar?.[4]?.gecti),
  },
  {
    no: 5,
    baslik: "Arıza enjekte et ve toparla",
    aciklama: "Gelmeyen sensör onayı ve ulaşılamayan hedef, güvenli bir son duruma çevriliyor.",
    gecti: (sonuclar) => Boolean(sonuclar?.[2]?.gecti && sonuclar?.[3]?.gecti),
  },
  {
    no: 6,
    baslik: "Teslim et",
    aciklama: "Beş senaryo da geçiyor VE kod, davranışı bozmadan yeniden düzenlendi.",
    gecti: (sonuclar, refactorHazir) => Boolean(sonuclar?.every((s) => s.gecti)) && refactorHazir,
  },
];

function senaryoEtiketi(senaryo: (typeof ESNEK_HUCRE_SENARYOLARI)[number], index: number): string {
  return senaryo.gizli ? `Gizli senaryo ${index + 1}` : `Görünür senaryo ${index + 1}`;
}

export function EsnekHucreLab() {
  const { code, setCode, durum, sonuclar, hataMesaji, golden, refactorSonucu, runAll, reset } = useEsnekHucreLab();
  const [karaNotu, setKararNotu] = useState("");

  // `refactorSonucu`, HOOK'un en son `runAll()` çağrısında GERÇEKTEN
  // değerlendirdiği kod üzerinden hesaplanır — bileşen burada AYRI bir
  // kodDegisti/refactorGecerli hesabı yapmaz (bkz. useEsnekHucreLab.ts'teki
  // yorum: bunun yapılması, hızlı dolgu+tıklama arasında UI'ın "geçti"
  // dediğiyle gerçekte çalıştırılan kodun ayrışmasına yol açabiliyordu).
  const hepsiGecti = Boolean(sonuclar?.every((s) => s.gecti));
  const kodDegisti = Boolean(refactorSonucu?.kodDegisti);
  const refactorHazir = Boolean(refactorSonucu?.gecerli);

  function raporuIndir() {
    const rapor = {
      sartname: {
        gecerliParcaTurleri: ["kutu", "silindir", "tepsi"],
        hedefSayisiAraligi: { min: 1, max: 4 },
      },
      testRaporu: sonuclar,
      calismaIzi: sonuclar?.map((s) => ({ senaryoId: s.senaryoId, durumGecmisi: s.durumGecmisi, hareketSayisi: s.hareketSayisi })),
      muhendislikKararNotu: karaNotu,
      olusturulmaZamani: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(rapor, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "esnek-hucre-teslim-raporu.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-3 rounded-xl border border-site-border bg-site-surface p-4">
          <span id="esnek-hucre-editor-label" className="text-sm font-medium text-site-ink">
            Python kodu — hücre yöneticisi
          </span>
          <LazyPythonCodeEditor
            id="esnek-hucre-editor"
            value={code}
            onChange={setCode}
            error={hataMesaji}
            labelledBy="esnek-hucre-editor-label"
            tone="site"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runAll}
              disabled={durum === "calisiyor"}
              className="h-11 rounded-md bg-site-strong px-4 text-site-on-strong disabled:opacity-50"
            >
              {durum === "calisiyor" ? "Beş senaryo çalışıyor…" : "Tüm senaryoları çalıştır"}
            </button>
            <button type="button" onClick={reset} className="h-11 rounded-md border border-site-border px-4 text-site-ink">
              Sıfırla
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-site-border bg-site-surface p-4" role="status" aria-live="polite">
          <span className="text-sm font-medium text-site-ink">Senaryo sonuçları</span>
          {!sonuclar ? (
            <p className="text-sm text-site-muted">Henüz çalıştırılmadı.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sonuclar.map((sonuc, index) => {
                const senaryo = ESNEK_HUCRE_SENARYOLARI[index];
                return (
                  <li
                    key={sonuc.senaryoId}
                    data-testid={`esnek-hucre-sonuc-${senaryo.id}`}
                    className={`rounded-lg border p-3 text-sm ${sonuc.gecti ? "border-success-border bg-success-surface text-success-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`}
                  >
                    <p className="font-semibold">
                      {sonuc.gecti ? "✓" : "○"} {senaryoEtiketi(senaryo, index)}
                    </p>
                    <p className="mt-1 text-xs">{senaryo.gizli && !sonuc.gecti ? "Ayrıntı, geçince gösterilir." : senaryo.aciklama}</p>
                    {!sonuc.gecti && <p className="mt-1 text-xs">{sonuc.gerekce}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-site-border bg-site-surface p-4">
        <p className="text-sm font-semibold text-site-ink">Altı teslim taşı</p>
        <ol className="mt-3 flex flex-col gap-2">
          {KILOMETRETASLARI.map((tas) => {
            const gecti = tas.gecti(sonuclar, refactorHazir);
            return (
              <li
                key={tas.no}
                data-testid={`esnek-hucre-milestone-${tas.no}`}
                className={`rounded-lg border p-3 text-sm ${gecti ? "border-success-border bg-success-surface text-success-ink" : "border-site-border bg-site-soft text-site-ink"}`}
              >
                <p className="font-semibold">{gecti ? "✓" : "○"} {tas.no}. {tas.baslik}</p>
                <p className="mt-1 text-xs text-site-muted">{tas.aciklama}</p>
              </li>
            );
          })}
        </ol>

        {hepsiGecti && !golden && (
          <p className="mt-3 rounded-lg border border-site-border bg-site-bg p-3 text-sm text-site-ink">
            Beş senaryo da geçti — bu koşu referans (altın) kayıt olarak saklandı. Şimdi kodu davranışını
            bozmadan yeniden düzenle (tekrarı fonksiyona ayır, isim iyileştir) ve tekrar çalıştır.
          </p>
        )}

        {golden && hepsiGecti && !refactorHazir && (
          <p className="mt-3 rounded-lg border border-warning-border bg-warning-surface p-3 text-sm text-warning-ink">
            {kodDegisti
              ? "Kod değişti ama davranış (durum sırası veya hareket sayısı) referanstan farklı çıktı — bu bir refactor değil, davranış değişikliği."
              : "Kod henüz referanstan farklı değil. Teslim için gerçekten yeniden düzenlemen gerekiyor."}
          </p>
        )}

        {refactorHazir && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-success-border bg-success-surface p-3 text-sm text-success-ink">
            <p className="font-semibold">Teslime hazır: davranış korunarak yeniden düzenlendi.</p>
            <label htmlFor="esnek-hucre-karar-notu" className="text-xs font-semibold uppercase tracking-wide">
              Kısa mühendislik karar notu
            </label>
            <textarea
              id="esnek-hucre-karar-notu"
              value={karaNotu}
              onChange={(event) => setKararNotu(event.target.value)}
              rows={3}
              className="rounded-md border border-site-border bg-site-surface p-2 text-sm text-site-ink"
              placeholder="Neyi neden bu şekilde tasarladın? (ör. arıza toparlama sırası, doğrulama kuralı)"
            />
            <button type="button" onClick={raporuIndir} className="h-11 w-fit rounded-md bg-site-strong px-4 text-site-on-strong">
              Teslim raporunu indir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
