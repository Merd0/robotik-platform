export type RosettaTaskId = "joint-pose" | "linear-path";
export type RosettaMotion = "joint" | "linear";

export interface MoveIntent {
  motion: RosettaMotion;
  targetPose: readonly [number, number, number, number, number, number];
  workFramePose: readonly [number, number, number, number, number, number];
  toolFramePose: readonly [number, number, number, number, number, number];
  stopAtTarget: boolean;
  speedIntent: "controlled-demo";
}

export interface RosettaTask {
  id: RosettaTaskId;
  title: string;
  prompt: string;
  intent: MoveIntent;
}

export interface RosettaDifference {
  id: "target" | "frame" | "speed" | "blend" | "tool";
  label: string;
  abb: string;
  mecademic: string;
  equivalent: boolean;
  consequence: string;
}

export const ROSETTA_SOURCES = {
  abb: {
    publisher: "ABB",
    document: "RAPID Instructions, Functions and Data Types · 3HAC050917-001 Rev F",
    url: "https://library.e.abb.com/public/b227fcd260204c4dbeb8a58f8002fe64/Rapid_instructions.pdf",
  },
  mecademic: {
    publisher: "Mecademic",
    document: "Meca500 Programming Manual · Firmware 11.3 · Revision A · 2026-04-28",
    url: "https://resources.mecademic.com/en/doc/MC-PM-MECA500/latest/manual/index.html",
  },
} as const;

export const ROSETTA_TASKS: readonly RosettaTask[] = [
  {
    id: "joint-pose",
    title: "Görev 1 · Pose'a eklem yoluyla git",
    prompt: "Öğretilmiş hedef pose'a TCP yolunu dayatmadan git ve hedefte tam dur.",
    intent: {
      motion: "joint",
      targetPose: [400, 120, 300, 180, 0, 90],
      workFramePose: [500, 0, 0, 0, 0, 0],
      toolFramePose: [0, 0, 120, 0, 0, 0],
      stopAtTarget: true,
      speedIntent: "controlled-demo",
    },
  },
  {
    id: "linear-path",
    title: "Görev 2 · Pose'a doğrusal yolla git",
    prompt: "Aynı hedef pose'a 100 mm/s TCP niyetiyle doğrusal git ve sonraki segmente yumuşak geç.",
    intent: {
      motion: "linear",
      targetPose: [400, 120, 300, 180, 0, 90],
      workFramePose: [500, 0, 0, 0, 0, 0],
      toolFramePose: [0, 0, 120, 0, 0, 0],
      stopAtTarget: false,
      speedIntent: "controlled-demo",
    },
  },
] as const;

function tuple(values: readonly number[]): string {
  return values.join(",");
}

export function getRosettaTask(taskId: RosettaTaskId): RosettaTask {
  return ROSETTA_TASKS.find((task) => task.id === taskId) ?? ROSETTA_TASKS[0];
}

export function buildVendorComparison(taskId: RosettaTaskId) {
  const task = getRosettaTask(taskId);
  const { intent } = task;
  const motionLine = intent.motion === "joint"
    ? "MoveJ pHedef, v100, fine, toolLab \\WObj:=wobjLab;"
    : "MoveL pHedef, v100, z10, toolLab \\WObj:=wobjLab;";
  const mecademicMotion = intent.motion === "joint"
    ? `MovePose(${tuple(intent.targetPose)})`
    : `MoveLin(${tuple(intent.targetPose)})`;
  const mecademicSpeed = intent.motion === "joint" ? "SetJointVel(25)" : "SetCartLinVel(100)";
  const mecademicBlend = intent.stopAtTarget ? "SetBlending(0)" : "SetBlending(50)";

  const differences: RosettaDifference[] = [
    {
      id: "target",
      label: "Hedef",
      abb: "pHedef adlı robtarget; pose yanında robot konfigürasyonu ve harici eksen bilgisi taşır.",
      mecademic: `${mecademicMotion.split("(")[0]} komutunda x, y, z ve Euler açıları doğrudan argümandır; duruş seçimi ayrı controller durumudur.`,
      equivalent: false,
      consequence: "Aynı altı pose sayısı, ABB robtarget'ının bütün semantiğini tek başına taşımaz.",
    },
    {
      id: "frame",
      label: "İş çerçevesi",
      abb: "wobjLab, hareket satırında \\WObj argümanıyla açıkça görünür.",
      mecademic: "SetWrf önce kuyruklanır; sonraki hareketlerin kullandığı controller durumunu değiştirir.",
      equivalent: false,
      consequence: "Mecademic satırını tek başına okumak etkin WRF'yi göstermeyebilir; ABB örneğinde seçim hareket satırındadır.",
    },
    {
      id: "speed",
      label: "Hız",
      abb: intent.motion === "joint"
        ? "v100 bir RAPID speeddata girdisidir; salt 'eklem yüzdesi' değildir."
        : "v100, hedef TCP doğrusal hızını 100 mm/s olarak ifade eden speeddata girdisidir.",
      mecademic: intent.motion === "joint"
        ? "SetJointVel(25), Meca500 için derecelendirilmiş eklem hızlarının yüzdesini ayarlar."
        : "SetCartLinVel(100), TRF için 100 mm/s üst sınırı ayarlar; gerçek hız eklem sınırlarıyla düşebilir.",
      equivalent: intent.motion === "linear",
      consequence: intent.motion === "joint"
        ? "v100 ile %25 aynı sayı ölçeğinde değildir; çevrim süresi eşitliği iddia edilemez."
        : "İstenen doğrusal hız aynı olsa da iki robotun gerçek izi ve sınırları eşit değildir.",
    },
    {
      id: "blend",
      label: "Geçiş / duruş",
      abb: intent.stopAtTarget ? "fine, hedefte tam duruş ister." : "z10, RAPID zone verisiyle köşe sapmasına izin verir.",
      mecademic: intent.stopAtTarget
        ? "SetBlending(0), sonraki uyumlu hareketler için blending'i kapatır."
        : "SetBlending(50), hızlanma/yavaşlama süresine bağlı yüzde temelli blending durumunu ayarlar.",
      equivalent: false,
      consequence: intent.stopAtTarget
        ? "Davranış niyeti tam duruştur; yine de biri satır argümanı, diğeri kalıcı controller durumudur."
        : "z10 ile %50 aynı geometrik tolerans değildir; sayılar birbirine dönüştürülemez.",
    },
    {
      id: "tool",
      label: "Takım / TCP",
      abb: "toolLab tooldata, hareket talimatının zorunlu argümanıdır.",
      mecademic: "SetTrf, sonraki hareketler için TRF'yi controller durumunda tanımlar.",
      equivalent: false,
      consequence: "Mecademic hareket satırı etkin TRF'yi tekrar etmez; önceki komut sırası anlamın parçasıdır.",
    },
  ];

  return {
    task,
    execution: "read-only" as const,
    outputs: {
      abb: {
        label: "ABB RAPID",
        lines: [
          "! pHedef, wobjLab ve toolLab önceden tanımlı/öğretilmiş veridir.",
          motionLine,
        ],
      },
      mecademic: {
        label: "Mecademic TCP/Text API",
        lines: [
          `SetWrf(${tuple(intent.workFramePose)})`,
          `SetTrf(${tuple(intent.toolFramePose)})`,
          mecademicSpeed,
          mecademicBlend,
          mecademicMotion,
        ],
      },
    },
    differences,
    screenReaderSummary: `Aynı ${intent.motion === "joint" ? "eklem-yolu" : "doğrusal-yol"} niyeti iki sistemde gösteriliyor; bu birebir çeviri değildir. Hedef, çerçeve, hız, geçiş ve takım varsayımları aşağıdaki beş satırda açıklanır.`,
  };
}
