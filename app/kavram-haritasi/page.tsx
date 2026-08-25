import type { Metadata } from "next";
import Link from "next/link";
import { getPublicLessons, HAT_ETIKET, hatEtiket, SEVIYE_ETIKET, type Seviye } from "@/lib/content";
import { computeCurriculumGraphLayout } from "@/lib/curriculumGraph";

export const metadata: Metadata = {
  title: "Kavram Haritası",
  description: "94 dersin hat ve seviyeye göre görsel haritası — ön koşul bağlantıları, özellikle hatlar arası olanlar, çizgiyle gösterilir.",
};

const SEVIYE_ORDER: readonly Seviye[] = ["ortaokul", "lise", "universite"];
const SEVIYE_DOT_CLASS: Record<Seviye, string> = {
  ortaokul: "fill-ortaokul-accent",
  lise: "fill-lise-accent",
  universite: "fill-universite-accent",
};

const MARGIN = 48;
const COLUMN_WIDTH = 140;
const ROW_HEIGHT = 160;

export default function KavramHaritasiPage() {
  const hatOrder = Object.keys(HAT_ETIKET);
  const lessons = getPublicLessons().map((lesson) => ({
    id: lesson.slug,
    baslik: lesson.frontmatter.baslik,
    hat: lesson.frontmatter.hat,
    seviye: lesson.frontmatter.seviye,
    onkosul: lesson.frontmatter.onkosul,
  }));
  const graph = computeCurriculumGraphLayout(lessons, hatOrder);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

  const width = hatOrder.length * COLUMN_WIDTH + MARGIN * 2;
  const height = SEVIYE_ORDER.length * ROW_HEIGHT + MARGIN * 2;
  const crossHatCount = graph.edges.filter((edge) => edge.crossHat).length;

  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg text-site-ink">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Genel bakış</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Kavram Haritası</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-site-muted">
          {lessons.length} dersin tamamı, konu hattı (sütun) ve seviyeye (satır) göre. İnce çizgiler gerçek ön
          koşul bağlantıları — {crossHatCount} tanesi farklı hatlar arasında. Bir noktaya tıklayıp o derse
          gidebilirsin.
        </p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-site-border bg-site-surface p-4">
          {
            // Ne `role="img"` ne `aria-hidden`: bu SVG içinde GERÇEK, tıklanabilir
            // `<a>` bağlantıları var — statik bir görsel değil. `role="img"` +
            // odaklanabilir alt öğe axe'de "Element has focusable descendants"
            // (wcag412) ihlali üretiyordu; `aria-hidden` ise odaklanabilir
            // içeriği gizleyip "aria-hidden-focus" ihlaline düşerdi. Etiketsiz
            // bırakmak SVG'yi düz bir grup olarak bırakıyor — her bağlantının
            // kendi erişilebilir adı zaten içindeki `<title>`den geliyor.
          }
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            aria-labelledby="kavram-haritasi-svg-baslik"
            className="min-w-[900px]"
          >
            <title id="kavram-haritasi-svg-baslik">{`${lessons.length} dersin hat ve seviyeye göre haritası, ${graph.edges.length} ön koşul bağlantısı ile`}</title>
            {hatOrder.map((hat, index) => (
              <text
                key={hat}
                x={MARGIN + index * COLUMN_WIDTH + 8}
                y={MARGIN - 16}
                className="fill-site-muted text-[10px] font-semibold uppercase tracking-wide"
              >
                {hatEtiket(hat)}
              </text>
            ))}
            {SEVIYE_ORDER.map((seviye, index) => (
              <text
                key={seviye}
                x={8}
                y={MARGIN + index * ROW_HEIGHT + 4}
                className="fill-site-muted text-[10px] font-semibold uppercase tracking-wide"
              >
                {SEVIYE_ETIKET[seviye]}
              </text>
            ))}

            <g transform={`translate(${MARGIN}, ${MARGIN})`}>
              {graph.edges.map((edge) => {
                const from = nodeById.get(edge.fromId);
                const to = nodeById.get(edge.toId);
                if (!from || !to) return null;
                return (
                  <line
                    key={`${edge.fromId}-${edge.toId}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className={edge.crossHat ? "stroke-site-accent-text" : "stroke-site-border"}
                    strokeWidth={edge.crossHat ? 1.5 : 1}
                    strokeOpacity={edge.crossHat ? 0.6 : 0.4}
                  />
                );
              })}
              {graph.nodes.map((node) => (
                <a key={node.id} href={`/ders/${node.id}`}>
                  <title>{`${node.baslik} · ${hatEtiket(node.hat)} · ${SEVIYE_ETIKET[node.seviye]}`}</title>
                  <circle cx={node.x} cy={node.y} r={6} className={SEVIYE_DOT_CLASS[node.seviye]} />
                </a>
              ))}
            </g>
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-site-muted">
          {SEVIYE_ORDER.map((seviye) => (
            <span key={seviye} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={`inline-block size-2.5 rounded-full ${SEVIYE_DOT_CLASS[seviye]}`} />
              {SEVIYE_ETIKET[seviye]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-px w-4 bg-site-accent-text" />
            Hatlar arası ön koşul
          </span>
        </div>

        <h2 className="mt-12 font-heading text-2xl font-semibold text-site-ink">Metin özeti</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-site-muted">
          Yukarıdaki haritanın ekran okuyucu için tam metin karşılığı — hat başına dersler, seviye sırasıyla.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {hatOrder.map((hat) => {
            const hatLessons = lessons
              .filter((lesson) => lesson.hat === hat)
              .sort((a, b) => SEVIYE_ORDER.indexOf(a.seviye) - SEVIYE_ORDER.indexOf(b.seviye));
            if (hatLessons.length === 0) return null;
            return (
              <div key={hat} className="rounded-xl border border-site-border bg-site-surface p-4">
                <h3 className="font-heading text-lg font-semibold text-site-ink">{hatEtiket(hat)}</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {hatLessons.map((lesson) => {
                    const crossHatPrereqs = lesson.onkosul
                      .map((id) => lessons.find((candidate) => candidate.id === id))
                      .filter((prerequisite): prerequisite is (typeof lessons)[number] => prerequisite !== undefined)
                      .filter((prerequisite) => prerequisite.hat !== hat);
                    return (
                      <li key={lesson.id} className="text-sm">
                        <span className="text-site-subtle">{SEVIYE_ETIKET[lesson.seviye]} · </span>
                        <Link href={`/ders/${lesson.id}`} className="underline decoration-2 underline-offset-4">
                          {lesson.baslik}
                        </Link>
                        {crossHatPrereqs.length > 0 && (
                          <span className="block text-xs text-site-muted">
                            Ön koşul (başka hat):{" "}
                            {crossHatPrereqs.map((prerequisite, index) => (
                              <span key={prerequisite.id}>
                                {index > 0 && ", "}
                                <Link href={`/ders/${prerequisite.id}`} className="underline decoration-2 underline-offset-4">
                                  {prerequisite.baslik}
                                </Link>
                              </span>
                            ))}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
