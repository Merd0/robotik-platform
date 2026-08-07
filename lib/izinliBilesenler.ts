/**
 * MDX içeriğinde kullanılmasına izin verilen bileşen adları.
 *
 * Bu liste saf veridir (React importu yok) — böylece hem tarayıcı tarafı
 * (`components/interactive/index.ts`) hem de Node tarafındaki güvenlik
 * denetimi (`lib/mdxGuvenlik.ts`) aynı kaynağı kullanabiliyor.
 *
 * Listenin `mdxComponents` ile birebir aynı kaldığını
 * `components/interactive/index.test.ts` doğruluyor: bir bileşen eklenip
 * buraya yazılmazsa test kırılır, yani denetim sessizce eskiyemez.
 */
export const IZINLI_BILESEN_ADLARI = [
  "JointSliders",
  "IkTarget",
  "JacobianViz",
  "PlannerRace",
  "CodeRunner",
  "Quiz",
  "BlockEditor",
  "SignalTimeline",
  "PixelToWorld",
  "ThresholdViewer",
  "ScanPath",
  "SafetyZone",
  "PredictionPrompt",
  "TransferChallenge",
] as const;
