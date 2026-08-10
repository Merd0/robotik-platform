/*
 * Etkileşimli bileşenin arayüzde görünen Türkçe adı. Bileşen adları kod
 * tarafında İngilizce (CLAUDE.md), kullanıcı arayüzü Türkçe — bu dosya
 * ikisi arasındaki tek eşleme noktası. Ana sayfa ve seviye sayfaları aynı
 * tablodan okur ki bir ders iki yerde iki farklı etiketle görünmesin.
 */
export const ETKILESIM_ETIKETI: Record<string, string> = {
  JointSliders: "eklem kontrolü",
  IkTarget: "hedef ve IK",
  JacobianViz: "Jacobian görselleştirme",
  PlannerRace: "planlayıcı karşılaştırma",
  MazePlanner: "labirent planlama",
  PredictionPrompt: "tahmin",
  TransferChallenge: "kavram kontrolü",
  CodeRunner: "kod çalıştırma",
  BlockEditor: "blok komut",
  SignalTimeline: "sinyal zamanlaması",
  ThresholdViewer: "eşikleme",
  PixelToWorld: "piksel–mm dönüşümü",
  ScanPath: "tarama yolu",
  SafetyZone: "güvenlik bölgesi",
  FourLensTraceLab: "dört mercekli iz",
  TransformOrderLab: "dönüşüm sırası",
  RobotSelectionTable: "robot seçimi",
  DlsTraceLab: "DLS iz denemesi",
  CspaceLab: "konfigürasyon uzayı",
};

/** Kartta gösterilecek tek etiket: bilinen ilk bileşen, yoksa okuma dersi. */
export function etkilesimEtiketi(etkilesimli: readonly string[]): string {
  for (const bilesen of etkilesimli) {
    const etiket = ETKILESIM_ETIKETI[bilesen];
    if (etiket) return etiket;
  }
  return "okuma ve alıştırma";
}
