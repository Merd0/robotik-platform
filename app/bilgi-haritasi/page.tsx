import type { Metadata } from "next";
import Link from "next/link";
import { KnowledgeGraphExplorer } from "@/components/knowledge/KnowledgeGraphExplorer";
import { buildKnowledgeGraph } from "@/lib/knowledgeGraph";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Robotik Bilgi Haritası — ders, kavram ve laboratuvar bağlantıları",
  description: "Robotik dersleri, sözlük terimleri, etkileşimli laboratuvarları ve Kod Akademisi modüllerini önkoşul ve içerik ilişkileriyle keşfet.",
  path: "/bilgi-haritasi",
});

export default function KnowledgeGraphPage() {
  const graph = buildKnowledgeGraph();
  const { summary } = graph;

  return (
    <main id="ana-icerik" className="min-h-screen bg-site-bg">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
          <Link href="/laboratuvar" className="inline-flex min-h-11 items-center underline underline-offset-4">Laboratuvarlar</Link>
          <span aria-hidden="true">/</span>
          Bilgi haritası
        </nav>
        <header className="mt-8 max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-site-accent-text">Robotics Knowledge Graph · gerçek katalog verisi</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-site-ink sm:text-6xl">Robotikte hangi kavramın nereye bağlandığını gör.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-site-muted">Bir kavram seç; onu kullanan dersler, bu derslerin önkoşulları ve bağlı deneyler birlikte vurgulansın. Harita yeni bir müfredat uydurmaz: platformda zaten bulunan ilişkileri görünür kılar.</p>
          <div aria-label="Bilgi haritası sayıları" className="mt-6 flex flex-wrap gap-2 text-sm font-semibold text-site-ink">
            <span className="rounded-full border border-site-border bg-site-surface px-3 py-2">{summary.totalNodes} düğüm</span>
            <span className="rounded-full border border-site-border bg-site-surface px-3 py-2">{summary.lessons} ders</span>
            <span className="rounded-full border border-site-border bg-site-surface px-3 py-2">{summary.terms} terim</span>
            <span className="rounded-full border border-site-border bg-site-surface px-3 py-2">{summary.labs} etkileşim/lab</span>
            <span className="rounded-full border border-site-border bg-site-surface px-3 py-2">{summary.codeModules} Kod Akademisi</span>
          </div>
        </header>

        <div className="mt-10"><KnowledgeGraphExplorer graph={graph} /></div>
      </div>
    </main>
  );
}
