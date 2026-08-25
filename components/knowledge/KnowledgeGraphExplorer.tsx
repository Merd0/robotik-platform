"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  KnowledgeGraphData,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeNodeKind,
  KnowledgeRelation,
} from "@/lib/knowledgeGraph";

const KIND_LABEL: Record<KnowledgeNodeKind, string> = {
  lesson: "Ders",
  term: "Sözlük",
  lab: "Etkileşim/lab",
  code: "Kod Akademisi",
};

const KIND_COLOR: Record<KnowledgeNodeKind, string> = {
  lesson: "#22d3ee",
  term: "#fbbf24",
  lab: "#a78bfa",
  code: "#34d399",
};

const RELATION_LABEL: Record<KnowledgeRelation, string> = {
  prerequisite: "önkoşul",
  "lesson-sequence": "hat sırası",
  "term-mention": "ilgili terim",
  "confused-with": "karıştırılan terim",
  interaction: "bağlı etkileşim",
  "code-sequence": "aşama sırası",
};

const LEVEL_INDEX = { ortaokul: 0, lise: 1, universite: 2 } as const;
const MAP_WIDTH = 1240;
const MAP_HEIGHT = 820;
const INTRO_STORAGE_KEY = "robotik-platform:bilgi-haritasi-tanitim:v1";

/**
 * İlk kullanımda kısa yönlendirme — harita 206 düğüm/360 ilişkiyle karmaşık,
 * hiçbir açıklama olmadan "bir SVG'ye tıkla" demek kafa karıştırır. Yalnız
 * ilk ziyarette görünür (localStorage bayrağı), kapatınca bir daha çıkmaz.
 * `docs/05` ilkesiyle uyumlu: hesap/çerez değil, yalnız bu tarayıcıda kalan
 * bir tercih.
 */
function FirstVisitIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Efekt gövdesinde doğrudan setState zincirleme render üretir
    // (react-hooks/set-state-in-effect); bir sonraki tik'e bırakılıyor
    // (bkz. bu dosyadaki `ready` state'i ve components/interactive/
    // CodeRunner.tsx'teki aynı desen).
    const zamanlayici = setTimeout(() => {
      try {
        setVisible(window.localStorage.getItem(INTRO_STORAGE_KEY) !== "gorundu");
      } catch {
        setVisible(true);
      }
    }, 0);
    return () => clearTimeout(zamanlayici);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, "gorundu");
    } catch {
      // localStorage engellenmişse sessizce yut — bir sonraki ziyarette tekrar görünür, o kadar.
    }
  }

  if (!visible) return null;

  return (
    <div role="note" aria-label="Bilgi haritası nasıl kullanılır" className="flex flex-col gap-3 rounded-2xl border border-site-strong bg-site-soft p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl text-sm leading-6 text-site-ink">
        <p className="font-heading text-base font-semibold">Bu harita nasıl çalışır?</p>
        <p className="mt-1.5">
          Aşağıdaki listeden bir kavram seç ya da haritadaki bir noktaya tıkla — o kavramın hangi derslerde,
          terimlerde, laboratuvarlarda ve Kod Akademisi modüllerinde geçtiğini görürsün. Beyaz halkalı nokta
          seçtiğin kavram, çevresindeki noktalar bir veya iki adımda ona bağlı olanlar. Harita geniş; yatay
          kaydırarak tamamını görebilirsin.
        </p>
      </div>
      <button type="button" onClick={dismiss} className="min-h-11 shrink-0 rounded-xl border border-site-border bg-site-bg px-4 text-sm font-semibold text-site-ink hover:bg-site-surface">
        Anladım, kapat
      </button>
    </div>
  );
}

interface PositionedNode extends KnowledgeGraphNode {
  x: number;
  y: number;
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function nodePositions(graph: KnowledgeGraphData): Map<string, PositionedNode> {
  const positioned = new Map<string, PositionedNode>();
  const trackIds = graph.tracks.map((track) => track.id);
  const byKind = Object.groupBy(graph.nodes, (node) => node.kind);

  for (const node of byKind.term ?? []) {
    const trackIndex = Math.max(0, trackIds.indexOf(node.hat ?? ""));
    const sameTrack = (byKind.term ?? []).filter((candidate) => candidate.hat === node.hat);
    const index = sameTrack.findIndex((candidate) => candidate.id === node.id);
    const columnWidth = MAP_WIDTH / trackIds.length;
    positioned.set(node.id, {
      ...node,
      x: columnWidth * trackIndex + 30 + (index % 3) * 42,
      y: 86 + Math.floor(index / 3) * 24,
    });
  }

  for (const node of byKind.lesson ?? []) {
    const trackIndex = Math.max(0, trackIds.indexOf(node.hat ?? ""));
    const sameBand = (byKind.lesson ?? []).filter((candidate) => candidate.hat === node.hat && candidate.level === node.level);
    const index = sameBand.findIndex((candidate) => candidate.id === node.id);
    const columnWidth = MAP_WIDTH / trackIds.length;
    positioned.set(node.id, {
      ...node,
      x: columnWidth * trackIndex + 24 + (index % 4) * 34,
      y: 310 + LEVEL_INDEX[node.level ?? "ortaokul"] * 105 + Math.floor(index / 4) * 25,
    });
  }

  for (const [index, node] of (byKind.lab ?? []).entries()) {
    positioned.set(node.id, {
      ...node,
      x: 38 + (index % 19) * 64,
      y: 665 + (index % 2) * 20,
    });
  }

  for (const [index, node] of (byKind.code ?? []).entries()) {
    positioned.set(node.id, {
      ...node,
      x: 38 + (index % 21) * 58,
      y: 760 + (index % 2) * 18,
    });
  }

  return positioned;
}

function neighborhood(graph: KnowledgeGraphData, selectedId: string) {
  const distance = new Map<string, number>([[selectedId, 0]]);
  const queue = [selectedId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDistance = distance.get(current)!;
    if (currentDistance >= 2) continue;
    for (const edge of graph.edges) {
      const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (next && !distance.has(next)) {
        distance.set(next, currentDistance + 1);
        queue.push(next);
      }
    }
  }
  return distance;
}

function relationToSelected(edges: readonly KnowledgeGraphEdge[], selectedId: string, nodeId: string) {
  return edges.find((edge) =>
    (edge.from === selectedId && edge.to === nodeId) || (edge.to === selectedId && edge.from === nodeId),
  )?.relation;
}

function KnowledgeMap({
  graph,
  selectedId,
  onSelect,
}: {
  graph: KnowledgeGraphData;
  selectedId: string;
  onSelect: (node: KnowledgeGraphNode) => void;
}) {
  const positions = useMemo(() => nodePositions(graph), [graph]);
  const distances = useMemo(() => neighborhood(graph, selectedId), [graph, selectedId]);
  const selected = positions.get(selectedId)!;
  const visibleEdges = graph.edges.filter((edge) => distances.has(edge.from) && distances.has(edge.to));

  return (
    <section aria-labelledby="gorsel-harita-baslik" className="min-w-0 overflow-hidden rounded-2xl border border-site-border bg-slate-950 p-3 text-slate-100 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">Görsel katman</p>
          <h2 id="gorsel-harita-baslik" className="mt-1 font-heading text-2xl font-semibold">{selected.label}</h2>
          <p className="mt-1 text-sm text-slate-300">{Math.max(0, distances.size - 1)} düğüm iki adım içinde vurgulandı.</p>
        </div>
        <div aria-label="Düğüm türleri" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
          {Object.entries(KIND_LABEL).map(([kind, label]) => (
            <span key={kind} className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: KIND_COLOR[kind as KnowledgeNodeKind] }} />{label}</span>
          ))}
        </div>
      </div>
      <div tabIndex={0} aria-label="Yatay kaydırılabilir görsel bilgi haritası" className="w-full min-w-0 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900">
        <svg
          role="img"
          aria-label={`${graph.summary.totalNodes} düğümlü robotik bilgi haritası; ${selected.label} bağlantıları vurgulanıyor.`}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="block h-auto"
          style={{ minWidth: 1100 }}
        >
          <title>{selected.label} çevresindeki ders, terim, etkileşim ve Kod Akademisi bağlantıları</title>
          {graph.tracks.map((track, index) => (
            <g key={track.id} aria-hidden="true">
              <line x1={(MAP_WIDTH / graph.tracks.length) * index} y1="38" x2={(MAP_WIDTH / graph.tracks.length) * index} y2="620" stroke="#334155" strokeWidth="1" />
              <text x={(MAP_WIDTH / graph.tracks.length) * index + 12} y="28" fill="#94a3b8" fontSize="11">{track.id}</text>
            </g>
          ))}
          <g aria-hidden="true" fill="#94a3b8" fontSize="11">
            <text x="12" y="62">Sözlük terimleri</text>
            <text x="12" y="288">Dersler · ortaokul / lise / üniversite</text>
            <text x="12" y="646">Derse bağlı etkileşimler</text>
            <text x="12" y="738">Kod Akademisi</text>
          </g>
          <g aria-hidden="true">
            {visibleEdges.map((edge) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;
              const touchesSelected = edge.from === selectedId || edge.to === selectedId;
              return <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={touchesSelected ? "#f8fafc" : "#64748b"} strokeWidth={touchesSelected ? 2.4 : 1.2} strokeDasharray={edge.relation.includes("sequence") ? "5 4" : undefined} opacity={touchesSelected ? 0.9 : 0.55} />;
            })}
          </g>
          {graph.nodes.map((node) => {
            const point = positions.get(node.id)!;
            const distance = distances.get(node.id);
            const isSelected = node.id === selectedId;
            const radius = isSelected ? 9 : distance === 1 ? 7 : distance === 2 ? 5.5 : 3.2;
            const opacity = distance === undefined ? 0.22 : distance === 2 ? 0.72 : 1;
            return (
              <g
                key={node.id}
                data-node-id={node.id}
                onClick={() => onSelect(node)}
                className="cursor-pointer"
                opacity={opacity}
              >
                <title>{`${KIND_LABEL[node.kind]}: ${node.label}`}</title>
                {isSelected ? <circle cx={point.x} cy={point.y} r="14" fill="none" stroke="#fff" strokeWidth="2" /> : null}
                <circle cx={point.x} cy={point.y} r={radius} fill={KIND_COLOR[node.kind]} stroke={distance === 1 ? "#fff" : "none"} strokeWidth="1" />
                {distance !== undefined && distance <= 1 ? (
                  <text x={point.x + 10} y={point.y + 4} fill="#f8fafc" fontSize="10" fontWeight={isSelected ? 700 : 500}>{node.label.slice(0, 24)}</text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">Düz çizgi içerik bağıdır; kesikli çizgi hat veya aşama sırasıdır. Harita yatay kaydırılabilir. Klavye ve ekran okuyucu için üstteki sonuç listesi aynı seçimi sunar.</p>
    </section>
  );
}

export function KnowledgeGraphExplorer({ graph }: { graph: KnowledgeGraphData }) {
  const initialId = graph.nodes.some((node) => node.id === "term:alet-merkez-noktasi")
    ? "term:alet-merkez-noktasi"
    : graph.nodes[0].id;
  const [selectedId, setSelectedId] = useState(initialId);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | KnowledgeNodeKind>("all");
  const [track, setTrack] = useState("all");
  const [announcement, setAnnouncement] = useState("alet merkez noktası seçildi.");
  const [ready, setReady] = useState(false);
  const selected = graph.nodes.find((node) => node.id === selectedId) ?? graph.nodes[0];
  const distances = useMemo(() => neighborhood(graph, selected.id), [graph, selected.id]);

  useEffect(() => {
    // Efekt gövdesinde doğrudan setState zincirleme render üretir
    // (react-hooks/set-state-in-effect); bir sonraki tik'e bırakılıyor
    // (bkz. components/interactive/CodeRunner.tsx'teki aynı desen).
    const zamanlayici = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(zamanlayici);
  }, []);

  const results = useMemo(() => {
    const needle = normalize(query.trim());
    return graph.nodes
      .filter((node) => kind === "all" || node.kind === kind)
      .filter((node) => track === "all" || node.hat === track)
      .filter((node) => !needle || normalize(`${node.label} ${node.subtitle} ${node.description}`).includes(needle))
      .sort((a, b) => {
        const distanceA = distances.get(a.id) ?? 99;
        const distanceB = distances.get(b.id) ?? 99;
        return distanceA - distanceB || a.label.localeCompare(b.label, "tr");
      });
  }, [distances, graph.nodes, kind, query, track]);

  function select(node: KnowledgeGraphNode) {
    setSelectedId(node.id);
    setAnnouncement(`${node.label} seçildi.`);
  }

  const connected = [...distances.entries()]
    .filter(([id]) => id !== selected.id)
    .map(([id, distance]) => ({ node: graph.nodes.find((node) => node.id === id)!, distance }))
    .sort((a, b) => a.distance - b.distance || a.node.label.localeCompare(b.node.label, "tr"));

  return (
    <div data-graph-ready={ready ? "true" : "false"} className="space-y-8">
      <FirstVisitIntro />

      <section aria-labelledby="katalog-baslik" className="grid min-w-0 grid-cols-1 gap-6 rounded-2xl border border-site-border bg-site-surface p-5 shadow-sm lg:grid-cols-3 lg:p-6">
        <div className="min-w-0 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-site-accent-text">Erişilebilir keşif listesi</p>
              <h2 id="katalog-baslik" className="mt-1 font-heading text-2xl font-semibold text-site-ink">Bir düğüm bul ve çevresini aç.</h2>
            </div>
            <p role="status" aria-live="polite" className="rounded-full bg-site-soft px-3 py-2 text-sm font-semibold text-site-ink">{announcement}</p>
          </div>
          <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="min-w-0 text-sm font-semibold text-site-ink sm:col-span-1">Düğüm ara
              <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" className="mt-2 min-h-11 w-full rounded-xl border border-site-border bg-site-bg px-3 font-normal outline-none focus:border-site-strong" placeholder="TCP, Jacobian, Python…" />
            </label>
            <label className="min-w-0 text-sm font-semibold text-site-ink">İçerik türü
              <select value={kind} onChange={(event) => setKind(event.target.value as "all" | KnowledgeNodeKind)} className="mt-2 min-h-11 w-full rounded-xl border border-site-border bg-site-bg px-3 font-normal">
                <option value="all">Tüm türler</option>
                {Object.entries(KIND_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="min-w-0 text-sm font-semibold text-site-ink">Hat
              <select value={track} onChange={(event) => setTrack(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-site-border bg-site-bg px-3 font-normal">
                <option value="all">Tüm hatlar</option>
                {graph.tracks.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.label}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-4 text-sm text-site-muted">{results.length} sonuçtan ilk {Math.min(40, results.length)} gösteriliyor.</p>
          <div style={{ maxHeight: 288 }} className="mt-3 grid gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {results.slice(0, 40).map((node) => (
              <button key={node.id} data-result-id={node.id} type="button" onClick={() => select(node)} aria-pressed={node.id === selected.id} className={`flex min-h-11 min-w-0 items-center gap-3 rounded-xl border bg-site-bg px-3 py-2 text-left hover:border-site-strong ${node.id === selected.id ? "border-site-strong bg-site-soft" : "border-site-border"}`}>
                <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: KIND_COLOR[node.kind] }} />
                <span className="min-w-0"><span className="block truncate font-semibold text-site-ink">{node.label}</span><span className="block truncate text-xs text-site-muted">{KIND_LABEL[node.kind]} · {node.subtitle}</span></span>
              </button>
            ))}
            {results.length === 0 ? <p className="py-4 text-sm text-site-muted">Bu filtrelerle eşleşen düğüm yok.</p> : null}
          </div>
        </div>
        <aside className="rounded-2xl bg-site-soft p-5">
          <h3 className="font-heading text-lg font-semibold text-site-ink">Harita neyi kullanıyor?</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-site-muted">
            <li>Derslerin mevcut önkoşul, hat, seviye ve sıra alanları</li>
            <li>Ders metnindeki mevcut “İlgili terimler” eşleşmeleri</li>
            <li>Derse bağlanmış etkileşim/lab bileşenleri</li>
            <li>Kod Akademisi’nin mevcut aşama ve sıra yapısı</li>
          </ul>
          <p className="mt-4 border-t border-site-border pt-4 text-xs leading-5 text-site-muted">Bağı olmayan bağı varmış gibi göstermiyoruz. Ayrı laboratuvar rotaları için kanonik ilişki alanı olmadığı sürece bu grafiğe yapay kenar eklenmez.</p>
        </aside>
      </section>

      <KnowledgeMap graph={graph} selectedId={selected.id} onSelect={select} />

      <section aria-label="Seçili düğüm" className="grid gap-6 rounded-2xl border border-site-border bg-site-surface p-5 lg:grid-cols-2 lg:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-site-accent-text">{KIND_LABEL[selected.kind]}</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-site-ink">{selected.label}</h2>
          <p className="mt-2 font-mono text-sm text-site-muted">{selected.subtitle}</p>
          <p className="mt-4 leading-7 text-site-muted">{selected.description}</p>
          {selected.href ? <Link href={selected.href} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-site-ink px-4 font-semibold text-site-bg">İçeriği aç →</Link> : <p className="mt-5 text-sm text-site-muted">Bu etkileşim, bağlı olduğu derslerin içinde açılır.</p>}
        </div>
        <div>
          <h3 className="font-heading text-xl font-semibold text-site-ink">Bağlantılar</h3>
          <p className="mt-1 text-sm text-site-muted">Önce doğrudan ilişkiler, sonra iki adımda ulaşılan içerikler.</p>
          <div style={{ maxHeight: 384 }} className="mt-4 grid gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {connected.map(({ node, distance }) => {
              const relation = relationToSelected(graph.edges, selected.id, node.id);
              return (
                <button key={node.id} type="button" onClick={() => select(node)} className="min-h-11 rounded-xl border border-site-border bg-site-bg p-3 text-left hover:border-site-strong">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-site-accent-text">{distance === 1 ? (relation ? RELATION_LABEL[relation] : "doğrudan") : "iki adımda"} · {KIND_LABEL[node.kind]}</span>
                  <span className="mt-1 block font-semibold text-site-ink">{node.label}</span>
                </button>
              );
            })}
            {connected.length === 0 ? <p className="text-sm text-site-muted">Bu düğümün mevcut veri yapısında bağlantısı yok.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
