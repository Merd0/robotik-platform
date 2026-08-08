import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

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
          <Link href="/sozluk" className="hidden min-h-11 items-center rounded-lg px-3 text-site-muted hover:bg-site-soft sm:inline-flex">Sözlük</Link>
          <Link href="/laboratuvar/robot-hucresi" className="inline-flex min-h-11 items-center rounded-lg bg-site-soft px-3 font-medium text-site-accent-text hover:bg-site-border">Canlı lab</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
