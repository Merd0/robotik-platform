import Link from "next/link";
import { MobileNavMenu } from "./MobileNavMenu";
import { ThemeToggle } from "./ThemeToggle";

const OVERFLOW_NAV_LINKS = [
  { href: "/sozluk", label: "Sözlük" },
  { href: "/ogretmen", label: "Öğretmen" },
  { href: "/laboratuvar/robot-hucresi", label: "Canlı lab" },
  { href: "/kod-akademisi", label: "Kod Akademisi" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-site-border bg-site-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Robotik Laboratuvarı ana sayfa" className="inline-flex min-h-11 items-center gap-2 font-heading font-semibold tracking-tight text-site-ink">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-slate-950 text-sm text-teal-300">R°</span>
          <span className="hidden sm:inline">Robotik Laboratuvarı</span>
        </Link>
        <nav aria-label="Ana menü" className="flex items-center gap-1 text-sm">
          <Link href="/ara" className="inline-flex min-h-11 items-center rounded-lg px-3 text-site-muted hover:bg-site-soft">Ara</Link>
          {OVERFLOW_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden min-h-11 items-center rounded-lg px-3 text-site-muted hover:bg-site-soft md:inline-flex"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/oyun-alani" className="inline-flex min-h-11 items-center rounded-lg bg-site-soft px-3 font-semibold text-site-ink hover:bg-site-border">Oyun alanı</Link>
          <MobileNavMenu links={OVERFLOW_NAV_LINKS} />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
