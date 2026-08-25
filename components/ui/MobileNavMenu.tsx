"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

interface NavLink {
  href: string;
  label: string;
}

/**
 * Dar viewport'ta (< lg) SiteHeader'daki ana kategori bağlantıları (Sözlük,
 * Öğretmen, Laboratuvarlar, Kod Akademisi) satır dışına taşmamak için
 * gizleniyor. Bu bileşen onlara hamburger/overflow menüsüyle erişim sağlar
 * — gizlenen bağlantı, ulaşılamaz bağlantı olmasın diye.
 *
 * Eşik `md` (768px) değil `lg` (1024px): bağlantılar + Ara kutusu + "Oyun
 * alanı" düğmesi + iki toggle aynı satırda `md` genişliğinde (768px, bkz.
 * `tablet-768` e2e projesi) yatay taşmaya (`scrollWidth > clientWidth`)
 * neden oluyordu. Tekil laboratuvar sayfaları (Robot Röportajı, Zaman
 * Kapsülü vb.) artık burada değil — 2026-08-26'da `/laboratuvar` hub'ına
 * konsolide edildi (bkz. docs/durum-denetim.md).
 */
export function MobileNavMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        onClick={() => setOpen((value) => !value)}
        className="grid size-11 shrink-0 place-items-center rounded-lg border border-site-border text-site-muted transition hover:bg-site-soft hover:text-site-ink"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      {open ? (
        <div
          id={panelId}
          role="menu"
          aria-label="Diğer sayfalar"
          className="absolute right-0 top-[calc(100%+0.5rem)] flex w-48 flex-col gap-1 rounded-lg border border-site-border bg-site-surface p-2 shadow-lg"
        >
          {links.map((link, index) => (
            <Link
              key={link.href}
              ref={index === 0 ? firstLinkRef : undefined}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-site-muted hover:bg-site-soft hover:text-site-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
