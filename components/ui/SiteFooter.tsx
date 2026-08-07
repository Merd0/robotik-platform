import Link from "next/link";

export function SiteFooter() {
  const build = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.NEXT_PUBLIC_BUILD_SHA?.slice(0, 7) ?? "yerel";
  return (
    <footer className="border-t border-site-border bg-site-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-site-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Açık çekirdek · Hesapsız ilerleme · Veriler yalnızca bu tarayıcıda</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/sozluk" className="min-h-11 py-3 underline underline-offset-4">Sözlük</Link>
          <span title="Yayın sürümü">sürüm {build}</span>
        </div>
      </div>
    </footer>
  );
}
