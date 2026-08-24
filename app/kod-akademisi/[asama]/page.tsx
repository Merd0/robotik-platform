import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ASAMA_ETIKET, getPublicModulesByAsama, KOD_AKADEMISI_ASAMALAR } from "@/lib/kodAkademisi";
import type { KodAkademisiAsama } from "@/lib/kodAkademisiArtifact";

export function generateStaticParams() {
  return KOD_AKADEMISI_ASAMALAR.map((asama) => ({ asama }));
}

interface AsamaPageProps {
  params: Promise<{ asama: string }>;
}

function isAsama(value: string): value is KodAkademisiAsama {
  return (KOD_AKADEMISI_ASAMALAR as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: AsamaPageProps): Promise<Metadata> {
  const { asama } = await params;
  if (!isAsama(asama)) return {};
  return { title: `${ASAMA_ETIKET[asama]} · Kod Akademisi`, alternates: { canonical: `/kod-akademisi/${asama}` } };
}

export default async function KodAkademisiAsamaPage({ params }: AsamaPageProps) {
  const { asama } = await params;
  if (!isAsama(asama)) notFound();

  const modules = getPublicModulesByAsama(asama);

  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="İçerik yolu" className="flex items-center gap-2 text-sm text-site-muted">
          <Link href="/kod-akademisi" className="inline-flex min-h-11 items-center underline underline-offset-4">Kod Akademisi</Link>
          <span>/</span>
          <span className="inline-flex min-h-11 items-center">{ASAMA_ETIKET[asama]}</span>
        </nav>

        <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{ASAMA_ETIKET[asama]}</h1>

        {modules.length === 0 ? (
          <p className="mt-6 max-w-xl text-base leading-7 text-site-muted">
            Bu aşamada henüz modül yok — yakında eklenecek.
          </p>
        ) : (
          <ol className="mt-8 flex flex-col gap-3">
            {modules.map((mod, index) => (
              <li key={mod.slug}>
                <Link
                  href={`/kod-akademisi/${asama}/${mod.slug}`}
                  className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-site-border bg-site-surface p-4 hover:bg-site-soft"
                >
                  <span>
                    <span className="font-mono text-xs text-site-accent-text">Modül {index + 1}</span>
                    <span className="mt-1 block font-heading text-lg font-semibold text-site-ink">{mod.frontmatter.baslik}</span>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {asama === "usta" && (
          <Link
            href="/kod-akademisi/kapanis"
            className="mt-6 flex min-h-11 items-center justify-between gap-4 rounded-xl border-2 border-site-strong bg-site-surface p-4 hover:bg-site-soft"
          >
            <span>
              <span className="font-mono text-xs text-site-accent-text">Usta ötesi kapanış projesi</span>
              <span className="mt-1 block font-heading text-lg font-semibold text-site-ink">Esnek Hücreyi Devreye Al</span>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </main>
  );
}
