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
import { computeEvidenceVersionRoot } from "./lessonArtifact";

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
    engineFiles: [
      "lib/robotics/kinematics.ts",
      "components/interactive/RobotInfoLine.tsx",
      "lib/robotics/robotMetadataDisplay.ts",
    ],
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
    engineFiles: [
      "components/interactive/Neden.tsx",
      "components/interactive/InlineNot.tsx",
      "components/interactive/RobotInfoLine.tsx",
      "components/ui/ComplexityModeProvider.tsx",
      "lib/robotics/ikSolver.ts",
      "lib/robotics/kinematics.ts",
      "lib/robotics/robotMetadataDisplay.ts",
      "lib/complexityMode.ts",
    ],
  },
  CodeRunner: {
    componentFile: "components/interactive/CodeRunner.tsx",
    // useCodeRunnerEngine.ts: worker/durum mantığının kendisi (2026-08-18'de
    // CodeRunner'dan çıkarıldı, Kod Akademisi'nin ayrı yerleşimiyle
    // paylaşılıyor) — davranışı belirleyen kod, sadece lib/robotics/**
    // değil.
    engineFiles: [
      "components/interactive/LazyPythonCodeEditor.tsx",
      "components/interactive/PythonCodeEditor.tsx",
      "components/interactive/useCodeRunnerEngine.ts",
      "lib/codeLab.ts",
      "lib/pythonCodeEditor.ts",
      "lib/robotics/kinematics.ts",
      "lib/robotics/pythonBridge.ts",
    ],
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
  PixelToWorld: {
    componentFile: "components/interactive/PixelToWorld.tsx",
    engineFiles: ["lib/pixelToWorld.ts"],
  },
  JacobianViz: {
    componentFile: "components/interactive/JacobianViz.tsx",
    engineFiles: [
      "components/interactive/NasilHesaplandi.tsx",
      "components/ui/ComplexityModeProvider.tsx",
      "lib/robotics/kinematics.ts",
      "lib/complexityMode.ts",
    ],
  },
  ScanPath: {
    componentFile: "components/interactive/ScanPath.tsx",
    engineFiles: ["lib/scanPath.ts"],
  },
  BlockEditor: {
    componentFile: "components/interactive/BlockEditor.tsx",
    engineFiles: ["lib/robotics/blockProgram.ts"],
  },
  ThresholdViewer: {
    componentFile: "components/interactive/ThresholdViewer.tsx",
    engineFiles: ["lib/threshold.ts"],
  },
  TransformOrderLab: {
    componentFile: "components/interactive/TransformOrderLab.tsx",
    engineFiles: ["lib/robotics/learningLabs.ts", "lib/robotics/transform.ts"],
  },
  DlsTraceLab: {
    componentFile: "components/interactive/DlsTraceLab.tsx",
    engineFiles: [
      "components/interactive/NasilHesaplandi.tsx",
      "components/ui/ComplexityModeProvider.tsx",
      "lib/robotics/kinematics.ts",
      "lib/complexityMode.ts",
    ],
  },
  CspaceLab: {
    componentFile: "components/interactive/CspaceLab.tsx",
    engineFiles: ["lib/robotics/learningLabs.ts", "lib/robotics/kinematics.ts"],
  },
  RobotSelectionTable: {
    componentFile: "components/interactive/RobotSelectionTable.tsx",
    engineFiles: ["lib/robotSelection.ts"],
  },
  FourLensTraceLab: {
    componentFile: "components/interactive/FourLensTraceLab.tsx",
    engineFiles: ["lib/robotics/fourLensTrace.ts"],
  },
  Terim: {
    componentFile: "components/interactive/Terim.tsx",
    engineFiles: [
      "components/interactive/TerimInline.tsx",
      "components/interactive/InlineNot.tsx",
      "lib/sozluk.ts",
    ],
  },
  Quiz: {
    componentFile: "components/interactive/Quiz.tsx",
    engineFiles: ["components/interactive/QuizSorusu.tsx", "lib/quiz.ts"],
  },
  PredictionPrompt: {
    componentFile: "components/interactive/PredictionPrompt.tsx",
    engineFiles: [],
  },
  TransferChallenge: {
    componentFile: "components/interactive/TransferChallenge.tsx",
    engineFiles: ["lib/quiz.ts"],
  },
  KodAkademisiCodeLab: {
    componentFile: "components/kod-akademisi/KodAkademisiCodeLab.tsx",
    engineFiles: [
      "components/interactive/LazyPythonCodeEditor.tsx",
      "components/interactive/PythonCodeEditor.tsx",
      "components/interactive/useCodeRunnerEngine.ts",
      "lib/codeLab.ts",
      "lib/pythonCodeEditor.ts",
      "lib/robotics/kinematics.ts",
      "lib/robotics/pythonBridge.ts",
    ],
    workerFiles: ["lib/workers/pyodideWorker.ts", "lib/workers/executionLimits.ts"],
  },
};

/** Robot id → spesifikasyon dosyası. Yalnız pilot laboratuvarların kullandığı robotlar. */
const ROBOT_SPEC_FILES: Record<string, string> = {
  "generic-2dof": "lib/robotics/robots/genericTwoDof.ts",
  "generic-prismatic": "lib/robotics/robots/genericPrismatic.ts",
  "generic-6dof": "lib/robotics/robots/genericSixDof.ts",
  "meca500-r4": "lib/robotics/robots/meca500R4.ts",
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

/**
 * Bir dersin MDX gövdesinden kullanılan bileşenleri ve (varsa) `robot`
 * prop'undaki robot id'lerini çıkarıp `interactionHash`i üretir. `robot`
 * prop'u olmayan bileşenler için `extractComponentStringProp` boş dizi
 * döner — hata değildir, sadece o bileşenin robot spec'i yoktur.
 */
export function computeLessonInteractionHash(lessonBody: string): string {
  const usedComponents = extractUsedComponents(lessonBody);
  const robotIds = usedComponents.flatMap((component) => extractComponentStringProp(lessonBody, component, "robot"));
  return computeInteractionHash(usedComponents, robotIds);
}

/**
 * Sprint 2'nin bağladığı üçüncü ve son parça: canlı ders sayfasının
 * `LessonEvidenceProvider`a verdiği GERÇEK `contentVersion`. `teachingHash`
 * çağırana bırakılır (zaten `computeTeachingHash(lesson)`den geliyor,
 * burada tekrar hesaplamaya gerek yok); `interactionHash` ve
 * `predicateHash` MDX gövdesinden ve `lessonId`den bu fonksiyonda üretilir.
 * Önceki durumla farkı: `lib/lessonArtifact.ts`teki
 * `computeEvidenceVersionRoot` üç kökü birleştiren SAF fonksiyondu ama hiçbir
 * çağıran onu gerçek `interactionHash`/`predicateHash` ile beslemiyordu —
 * bu fonksiyon o eksik bağlantıyı kurar (bkz. docs/durum-denetim.md "Faz 2").
 */
export function computeLessonContentVersion(lessonId: string, lessonBody: string, teachingHash: string): string {
  return computeEvidenceVersionRoot({
    teachingHash,
    interactionHash: computeLessonInteractionHash(lessonBody),
    predicateHash: computePredicateHash(lessonId),
  });
}
