"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * docs/16-urun-denetimi.md öncelik #8 (madde 39) — Ctrl+K/⌘K ile açılan hızlı
 * ders arama kutusu. Bu dosya HER SAYFADA (kök layout) yüklü kalan küçük
 * kabuk: yalnız klavye kısayolunu dinler ve `open` durumunu tutar.
 *
 * Ağır kısım (arama motoru, sonuç listesi, klavye gezinmesi —
 * `CommandPaletteDialog.tsx`) `next/dynamic({ ssr: false })` ile tembel
 * yüklenir — `components/scene/LazyScene.tsx` ile AYNI desen. İlk ölçümde
 * paleti tek dosyada tutmak ana sayfanın ilk yükleme JS bütçesini (docs/05,
 * < 200 KB) aşırdı; bu bölünme onu düzeltti — kullanıcı Ctrl+K'ye hiç
 * basmazsa arama kodu hiçbir zaman indirilmez.
 */
const CommandPaletteDialog = dynamic(
  () => import("./CommandPaletteDialog").then((mod) => mod.CommandPaletteDialog),
  { ssr: false },
);

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const tetikleyiciRef = useRef<HTMLElement | null>(null);

  const kapat = useCallback(() => {
    setOpen(false);
    tetikleyiciRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      setOpen((mevcut) => {
        if (!mevcut) tetikleyiciRef.current = document.activeElement as HTMLElement | null;
        return true;
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;
  return <CommandPaletteDialog onClose={kapat} />;
}
