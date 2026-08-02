import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * onkosul: alanlarını yönlü bir graph olarak kurup doğrular
 * (docs/09-ai-muhendisligi.md bölüm 5). Ders sayısı arttıkça elle takip
 * edilemeyen üç şeyi saniyeler içinde kontrol eder: döngü, var olmayan
 * referans, kopuk (hiçbir dersten erişilemeyen) düğüm.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

interface LessonNode {
  id: string;
  hat: string;
  seviye: string;
  sira: number;
  onkosul: string[];
  filePath: string;
}

function findMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findMdxFiles(fullPath);
    return entry.name.endsWith(".mdx") ? [fullPath] : [];
  });
}

function loadNodes(): LessonNode[] {
  return findMdxFiles(CONTENT_DIR).map((filePath) => {
    const { data } = matter(fs.readFileSync(filePath, "utf8"));
    return {
      id: data.id,
      hat: data.hat,
      seviye: data.seviye,
      sira: data.sira ?? 0,
      onkosul: Array.isArray(data.onkosul) ? data.onkosul : [],
      filePath: path.relative(process.cwd(), filePath),
    };
  });
}

/** DFS ile döngü tespiti: ders -> onkosul kenarları üzerinde. */
function findCycle(nodes: Map<string, LessonNode>): string[] | null {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const id of nodes.keys()) color.set(id, WHITE);

  const stack: string[] = [];

  function visit(id: string): string[] | null {
    color.set(id, GRAY);
    stack.push(id);
    const node = nodes.get(id);
    for (const dep of node?.onkosul ?? []) {
      if (!nodes.has(dep)) continue; // eksik referans ayrı kontrol ediliyor
      const depColor = color.get(dep);
      if (depColor === GRAY) {
        const cycleStart = stack.indexOf(dep);
        return [...stack.slice(cycleStart), dep];
      }
      if (depColor === WHITE) {
        const found = visit(dep);
        if (found) return found;
      }
    }
    stack.pop();
    color.set(id, BLACK);
    return null;
  }

  for (const id of nodes.keys()) {
    if (color.get(id) === WHITE) {
      const found = visit(id);
      if (found) return found;
    }
  }
  return null;
}

function trackKey(node: LessonNode): string {
  return `${node.hat}::${node.seviye}`;
}

function main() {
  const list = loadNodes();
  if (list.length === 0) {
    console.log("content/ altında henüz .mdx dosyası yok.");
    return;
  }

  const nodes = new Map<string, LessonNode>();
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const node of list) {
    if (nodes.has(node.id)) {
      errors.push(`id "${node.id}" birden fazla dosyada kullanılıyor.`);
      continue;
    }
    nodes.set(node.id, node);
  }

  // 1. Var olmayan referans
  for (const node of nodes.values()) {
    for (const dep of node.onkosul) {
      if (!nodes.has(dep)) {
        errors.push(`${node.filePath}: onkosul "${dep}" hiçbir derste tanımlı değil.`);
      }
    }
  }

  // 2. Döngü
  const cycle = findCycle(nodes);
  if (cycle) {
    errors.push(`Ön koşul zincirinde döngü bulundu: ${cycle.join(" -> ")}`);
  }

  // 3. Kopuk düğüm — aynı hatta+seviyede başka ders yoksa (ilk ders,
  // sira:1) meşrudur; onun dışında hem onkosul'ü boş hem kimsenin
  // onkosul'ünde yer almayan bir ders muhtemelen unutulmuş bir bağlantıdır.
  const incoming = new Set<string>();
  for (const node of nodes.values()) {
    for (const dep of node.onkosul) incoming.add(dep);
  }
  const trackSizes = new Map<string, number>();
  for (const node of nodes.values()) {
    trackSizes.set(trackKey(node), (trackSizes.get(trackKey(node)) ?? 0) + 1);
  }
  for (const node of nodes.values()) {
    const isFirstInTrack = node.sira === 1 || trackSizes.get(trackKey(node)) === 1;
    if (node.onkosul.length === 0 && !incoming.has(node.id) && !isFirstInTrack) {
      warnings.push(
        `${node.filePath}: "${node.id}" hiçbir dersin ön koşulu değil ve kendi ön koşulu da yok — kopuk düğüm olabilir.`,
      );
    }
  }

  // 4. Ön koşulsuz üniversite dersi — hata değil, uyarı
  for (const node of nodes.values()) {
    if (node.seviye === "universite" && node.onkosul.length === 0) {
      warnings.push(
        `${node.filePath}: üniversite seviyesinde ön koşulu olmayan bir ders ("${node.id}") — kasıtlı mı, kontrol et.`,
      );
    }
  }

  if (warnings.length > 0) {
    console.warn(`${warnings.length} uyarı:\n`);
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.warn("");
  }

  if (errors.length > 0) {
    console.error(`${errors.length} hata bulundu:\n`);
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log(`${nodes.size} ders graph olarak doğrulandı, döngü/eksik referans yok.`);
}

main();
