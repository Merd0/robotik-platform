export default function Loading() {
  return (
    <main id="ana-icerik" aria-busy="true" aria-label="Laboratuvar yükleniyor" className="min-h-[70vh] px-4 py-16 sm:px-6 sm:py-24">
      <div className="lab-panel mx-auto max-w-4xl p-6 sm:p-8">
        <span className="sr-only">Laboratuvar yükleniyor.</span>
        <div aria-hidden="true" className="animate-pulse space-y-5">
          <div className="h-3 w-32 rounded bg-site-border" />
          <div className="h-10 max-w-xl rounded bg-site-soft" />
          <div className="h-4 max-w-2xl rounded bg-site-soft" />
          <div className="grid gap-4 pt-4 sm:grid-cols-3">
            <div className="h-36 rounded-2xl bg-site-soft" />
            <div className="h-36 rounded-2xl bg-site-soft" />
            <div className="h-36 rounded-2xl bg-site-soft" />
          </div>
        </div>
      </div>
    </main>
  );
}
