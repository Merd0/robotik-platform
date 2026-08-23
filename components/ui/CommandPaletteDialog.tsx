"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { aramaYap, indeksHazirla, type AramaKaydi, type AramaKaydiHam, type AramaSonuc } from "@/lib/arama";

const SONUC_SINIRI = 8;

interface CommandPaletteDialogProps {
  onClose: () => void;
}

/**
 * `CommandPalette.tsx`teki (her sayfada yüklü, küçük kabuk) tembel yüklenen
 * ağır kısım — arama motoru + sonuç listesi + klavye gezinmesi. `next/dynamic`
 * ile yalnız kullanıcı gerçekten paleti açtığında indirilir (bkz. o dosyanın
 * başlığı, `components/scene/LazyScene.tsx` ile aynı desen).
 *
 * Native `<Link>` elemanları ve gerçek DOM odağı (roving focus) kullanır —
 * `useRouter`/programatik yönlendirme YOK: Enter tuşu odaklanmış linkin
 * TARAYICI VARSAYILANI ile tetiklenir.
 *
 * `aria-modal="true"` bir odak tuzağı (focus trap) vaat eder — bu yüzden
 * Escape ve Tab-döngüsü `MobileNavMenu.tsx`teki gibi DOKÜMAN seviyesinde
 * dinlenir, yalnız input/sonuç elemanlarının kendi `onKeyDown`'ına değil.
 * Aksi halde odak son sonuçtan Tab'la overlay'in ARKASINDAKİ (görsel olarak
 * gizli ama DOM'da hâlâ var olan) sayfa linklerine kaçabilirdi.
 */
export function CommandPaletteDialog({ onClose }: CommandPaletteDialogProps) {
  const [sorgu, setSorgu] = useState("");
  const [indeks, setIndeks] = useState<AramaKaydi[] | null>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "hata">("yukleniyor");
  const inputRef = useRef<HTMLInputElement>(null);
  const sonucRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const baslikId = useId();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const oncekiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function odaklanabilirler(): (HTMLInputElement | HTMLAnchorElement)[] {
      return [inputRef.current, ...sonucRefs.current].filter(
        (el): el is HTMLInputElement | HTMLAnchorElement => el !== null,
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const elemanlar = odaklanabilirler();
      if (elemanlar.length === 0) return;
      const ilk = elemanlar[0];
      const son = elemanlar[elemanlar.length - 1];

      if (event.shiftKey && document.activeElement === ilk) {
        event.preventDefault();
        son.focus();
      } else if (!event.shiftKey && document.activeElement === son) {
        event.preventDefault();
        ilk.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = oncekiOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
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
  }, []);

  const sonuclar: AramaSonuc[] = indeks && sorgu.trim() ? aramaYap(indeks, sorgu, SONUC_SINIRI) : [];

  function inputKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" && sonuclar.length > 0) {
      event.preventDefault();
      sonucRefs.current[0]?.focus();
    }
  }

  function sonucKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      (sonucRefs.current[index + 1] ?? sonucRefs.current[0])?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else sonucRefs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 p-4 pt-[12vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={baslikId}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-site-border bg-site-surface p-4 shadow-2xl"
      >
        <h2 id={baslikId} className="sr-only">
          Hızlı ders arama
        </h2>
        <input
          ref={inputRef}
          type="search"
          value={sorgu}
          onChange={(event) => setSorgu(event.target.value)}
          onKeyDown={inputKeyDown}
          placeholder="Ders ara… (ör. tekillik, IK, güvenli bölge)"
          autoComplete="off"
          className="min-h-11 w-full rounded-lg border border-site-border bg-site-bg px-4 py-2 text-site-ink outline-none focus-visible:ring-2 focus-visible:ring-site-strong"
        />
        <p role="status" aria-live="polite" className="mt-2 text-xs text-site-muted">
          {durum === "yukleniyor" && "Arama indeksi yükleniyor…"}
          {durum === "hata" && "Arama indeksi yüklenemedi. Tam sayfa aramayı dene: /ara"}
          {durum === "hazir" && sorgu.trim() && `${sonuclar.length} sonuç`}
          {durum === "hazir" && !sorgu.trim() && "Yazmaya başla."}
        </p>
        {sonuclar.length > 0 && (
          <ul className="mt-2 max-h-80 overflow-y-auto">
            {sonuclar.map((sonuc, index) => (
              <li key={sonuc.kayit.id}>
                <Link
                  ref={(el) => {
                    sonucRefs.current[index] = el;
                  }}
                  href={`/ders/${sonuc.kayit.id}`}
                  onClick={onClose}
                  onKeyDown={(event) => sonucKeyDown(event, index)}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-site-soft focus-visible:bg-site-strong focus-visible:text-site-on-strong focus-visible:outline-none"
                >
                  <span className="block font-semibold">{sonuc.kayit.baslik}</span>
                  <span className="block text-xs opacity-70">
                    {sonuc.kayit.hatEtiket} · {sonuc.kayit.seviyeEtiket}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
