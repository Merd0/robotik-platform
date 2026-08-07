import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-heading font-semibold tracking-tight text-slate-950">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-slate-950 text-sm text-teal-300">R°</span>
          Robotik Laboratuvarı
        </Link>
        <nav aria-label="Ana menü" className="flex items-center gap-1 text-sm">
          <Link href="/ara" className="inline-flex min-h-11 items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100">Ara</Link>
          <Link href="/sozluk" className="hidden min-h-11 items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100 sm:inline-flex">Sözlük</Link>
          <Link href="/laboratuvar/robot-hucresi" className="inline-flex min-h-11 items-center rounded-lg bg-teal-50 px-3 font-medium text-teal-900 hover:bg-teal-100">Canlı lab</Link>
        </nav>
      </div>
    </header>
  );
}
