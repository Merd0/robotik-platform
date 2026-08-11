import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import matter from "gray-matter";
import type { Node } from "unist";
import { EVIDENCE_PREDICATES } from "./evidence";
import { IZINLI_BILESEN_ADLARI } from "./izinliBilesenler";

/**
 * Sprint 2 "Kanıt Dikey Dilimi" — bağımlılık manifesti.
 *
 * Bir laboratuvarın "gerçekten aynı deney mi" sorusu dört şeye bağlı: hangi
 * bileşen render ediliyor, o bileşenin dayandığı saf motor kodu ne, hangi
 * robot spesifikasyonu kullanılıyor, ve (varsa) hangi worker kodu çalışıyor.
 * Bunların HERHANGİ biri değişirse aynı ders sürümünün ürettiği kanıt artık
 * aynı deneyin kanıtı değildir.
 *
 * Kaynak-hash felsefesi projede zaten var (bkz. lib/lessonArtifact.ts) —
 * burada aynı felsefeyi ders metninin ÖTESİNE, gerçekten çalışan koda
 * taşıyoruz: elle tutulan bir sürüm numarası değil, dosya içeriğinin kendisi
 * hash'lenir.
 *
 * Başlangıç kapsamı Sprint 2'nin üç pilot laboratuvarıydı (JointSliders,
 * PlannerRace, IkTarget); sonraki laboratuvarlar aynı sözleşmeyle eklenir. Kayıtlı
 * olmayan bir bileşen için `computeInteractionHash` açıkça hata fırlatır —
 * sessizce eksik/yanlış bir hash üretmez.
 */

const REPO_ROOT = process.cwd();

export interface LabDependencyManifest {
  /** Bileşenin kendi dosyası, repo köküne göreli. */
  componentFile: string;
  /** Bileşenin dayandığı saf motor dosyaları (lib/robotics/**), repo köküne göreli. */
  engineFiles: string[];
  /** Varsa, bileşenin kullandığı Web Worker kaynağı (derlenmiş çıktı değil). */
  workerFiles?: string[];
}

export const LAB_DEPENDENCY_REGISTRY: Record<string, LabDependencyManifest> = {
  JointSliders: {
    componentFile: "components/interactive/JointSliders.tsx",
    engineFiles: ["lib/robotics/kinematics.ts"],
  },
  PlannerRace: {
    componentFile: "components/interactive/PlannerRace.tsx",
    engineFiles: [
      "lib/robotics/planners/index.ts",
      "lib/robotics/planners/base.ts",
      "lib/robotics/planners/astar.ts",
      "lib/robotics/planners/rrt.ts",
      "lib/robotics/planners/rrtStar.ts",
      "lib/robotics/planners/validatePlanResult.ts",
      "lib/robotics/collision.ts",
      "lib/robotics/random.ts",
    ],
    workerFiles: ["lib/workers/plannerWorker.ts"],
  },
  IkTarget: {
    componentFile: "components/interactive/IkTarget.tsx",
    engineFiles: ["lib/robotics/ikSolver.ts", "lib/robotics/kinematics.ts"],
  },
  CodeRunner: {
    componentFile: "components/interactive/CodeRunner.tsx",
    engineFiles: ["lib/codeLab.ts", "lib/robotics/kinematics.ts"],
    workerFiles: ["lib/workers/pyodideWorker.ts", "lib/workers/executionLimits.ts"],
  },
  SignalTimeline: {
    componentFile: "components/interactive/SignalTimeline.tsx",
    engineFiles: ["lib/signalTimeline.ts"],
  },
  SafetyZone: {
    componentFile: "components/interactive/SafetyZone.tsx",
    engineFiles: ["lib/robotics/safety.ts"],
  },
};

/** Robot id → spesifikasyon dosyası. Yalnız pilot laboratuvarların kullandığı robotlar. */
const ROBOT_SPEC_FILES: Record<string, string> = {
  "generic-2dof": "lib/robotics/robots/genericTwoDof.ts",
  "generic-prismatic": "lib/robotics/robots/genericPrismatic.ts",
  "generic-6dof": "lib/robotics/robots/genericSixDof.ts",
};

const IZINLI_BILESENLER = new Set<string>(IZINLI_BILESEN_ADLARI);

/**
 * MDX gövdesinde gerçekten kullanılan (izinli) bileşen adlarını AST'den
 * çıkarır. `etkilesimli` frontmatter alanına güvenmez — yazarın elle girdiği
 * o alan yanlış/eski olabilir; gerçek kaynak MDX'in kendisidir. Aynı
 * AST-gezinme deseni `lib/mdxGuvenlik.ts`'te de kullanılıyor.
 */
export function extractUsedComponents(mdxBody: string): string[] {
  const { content: govde } = matter(mdxBody);
  const agac = unified().use(remarkParse).use(remarkMdx).parse(govde);
  const bulunanlar = new Set<string>();

  visit(agac, (dugum: Node) => {
    if (dugum.type !== "mdxJsxFlowElement" && dugum.type !== "mdxJsxTextElement") return;
    const eleman = dugum as Node & { name: string | null };
    if (eleman.name && IZINLI_BILESENLER.has(eleman.name)) bulunanlar.add(eleman.name);
  });

  return [...bulunanlar].sort();
}

/**
 * Bir bileşenin JSX çağrılarındaki düz metin (literal) string prop
 * değerlerini toplar. Yalnız düz dize öznitelikleri okur (`robot="..."`) —
 * `{...}` ifadeleri zaten `lib/mdxGuvenlik.ts` tarafından veri-dışı
 * kullanımlara kapatıldığı için burada JS ifadesi çözümlemeye gerek yok.
 */
export function extractComponentStringProp(mdxBody: string, componentName: string, propName: string): string[] {
  const { content: govde } = matter(mdxBody);
  const agac = unified().use(remarkParse).use(remarkMdx).parse(govde);
  const degerler = new Set<string>();

  visit(agac, (dugum: Node) => {
    if (dugum.type !== "mdxJsxFlowElement" && dugum.type !== "mdxJsxTextElement") return;
    const eleman = dugum as Node & {
      name: string | null;
      attributes?: { type: string; name?: string; value?: unknown }[];
    };
    if (eleman.name !== componentName) return;
    for (const oznitelik of eleman.attributes ?? []) {
      if (oznitelik.type !== "mdxJsxAttribute" || oznitelik.name !== propName) continue;
      if (typeof oznitelik.value === "string") degerler.add(oznitelik.value);
    }
  });

  return [...degerler].sort();
}

function sha256File(repoRelativePath: string): string {
  const fullPath = path.join(REPO_ROOT, repoRelativePath);
  const bytes = fs.readFileSync(fullPath);
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Verilen dosya listesinin (repo köküne göreli) içerik hash'lerini üretir.
 * Node/fs'e bağımlı — yalnız derleme zamanı/script bağlamında çağrılır.
 */
export function readDependencyDigests(repoRelativePaths: readonly string[]): Record<string, string> {
  const digests: Record<string, string> = {};
  for (const relativePath of [...repoRelativePaths].sort()) {
    digests[relativePath] = sha256File(relativePath);
  }
  return digests;
}

/**
 * Kullanılan bileşen + robot id kümesinden interactionHash üretir.
 *
 * Kapsanan: bileşenin kendi dosyası, dayandığı saf motor dosyaları, (varsa)
 * worker kaynağı, ve kullanılan her robot id'sinin spesifikasyon dosyası.
 * Kayıtlı olmayan bir bileşen veya bilinmeyen bir robot id verilirse açıkça
 * hata fırlatır (bkz. modül başındaki not).
 */
export function computeInteractionHash(usedComponents: readonly string[], robotIds: readonly string[] = []): string {
  const sortedComponents = [...usedComponents].sort();
  const dependencyFiles = new Set<string>();

  for (const component of sortedComponents) {
    const manifest = LAB_DEPENDENCY_REGISTRY[component];
    if (!manifest) {
      throw new Error(
        `computeInteractionHash: "${component}" için LAB_DEPENDENCY_REGISTRY kaydı yok (pilot kapsamı dışında).`,
      );
    }
    dependencyFiles.add(manifest.componentFile);
    for (const engineFile of manifest.engineFiles) dependencyFiles.add(engineFile);
    for (const workerFile of manifest.workerFiles ?? []) dependencyFiles.add(workerFile);
  }

  const sortedRobotIds = [...new Set(robotIds)].sort();
  for (const robotId of sortedRobotIds) {
    const specFile = ROBOT_SPEC_FILES[robotId];
    if (!specFile) throw new Error(`computeInteractionHash: bilinmeyen robot id "${robotId}".`);
    dependencyFiles.add(specFile);
  }

  const digests = readDependencyDigests([...dependencyFiles]);
  const payload = JSON.stringify({
    schema: "interaction-manifest/v1",
    components: sortedComponents,
    robotIds: sortedRobotIds,
    digests,
  });
  return `sha256:${createHash("sha256").update(payload, "utf8").digest("hex")}`;
}

/**
 * Bir dersin predicate sürüm imzası: o derse bağlı predicate id'lerinin
 * (zaten `-v1`/`-v2` gibi sürümlenmiş) sıralı kümesi. Predicate mantığı
 * değişip id sürümlenince (bkz. Sprint 0) bu hash de değişir — böylece
 * "predicate mantığı değişti ama ders metni değişmedi" durumu da
 * yakalanabilir bir imza taşır. Saf (fs yok): EVIDENCE_PREDICATES zaten
 * bellek-içi statik bir dizi.
 */
export function computePredicateHash(lessonId: string): string {
  const predicateIds = EVIDENCE_PREDICATES.filter((predicate) => predicate.lessonId === lessonId)
    .map((predicate) => predicate.id)
    .sort();
  const payload = JSON.stringify({ schema: "predicate-manifest/v1", lessonId, predicateIds });
  return `sha256:${createHash("sha256").update(payload, "utf8").digest("hex")}`;
}
