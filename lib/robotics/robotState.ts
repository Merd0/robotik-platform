/**
 * Paylaşılan robot durum modeli (docs/16-urun-denetimi.md Madde 28).
 *
 * Sorun: her etkileşimli bileşen (CodeRunner, RobotCellStudio, IkTarget…)
 * kendi ad-hoc durum/başarısızlık tipini taşıyor (`RunState`,
 * `RobotCellMotionStatus`, `ReachabilityStatus`, ...) — bunların hepsi
 * GERÇEK, hesaplanmış sinyaller ama tek bir tutarlı sözlükte buluşmuyorlar.
 * Bu dosya o sinyalleri tüketen, saf bir normalleştirme katmanıdır — yeni
 * bir çarpışma/erişilebilirlik hesabı İCAT ETMEZ, var olan bileşenlerin
 * zaten ürettiği sinyalleri ortak bir durum kümesine çevirir.
 *
 * Öncelik sırası (bir sinyal diğerini geçersiz kılar): çarpışma en kritik
 * (fiziksel güvenlik) → erişilemez (beklenen, spesifik bir sınır durumu) →
 * genel hata → duraklat → meşgul (planlama/hareket) → tamamlandı → boşta.
 */

export type RobotState =
  | "idle"
  | "planning"
  | "moving"
  | "paused"
  | "completed"
  | "error"
  | "collision"
  | "unreachable";

export interface RobotStateSignals {
  /** Aktif bir hesaplama veya animasyon sürüyor mu. */
  busy?: boolean;
  /** `busy` true iken hangi aşamada olunduğu; verilmezse "moving" varsayılır. */
  phase?: "planning" | "moving";
  paused?: boolean;
  completed?: boolean;
  /** Genel/beklenmeyen hata (worker hatası, zaman aşımı, sözdizimi hatası vb.). */
  error?: boolean;
  /** Hedefe giden yol veya poz, fiziksel bir engelle çarpışıyor. */
  collision?: boolean;
  /** Hedef, robotun eklem limitleri veya geometrisiyle hiçbir şekilde ulaşılamaz. */
  unreachable?: boolean;
}

export function deriveRobotState(signals: RobotStateSignals): RobotState {
  if (signals.collision) return "collision";
  if (signals.unreachable) return "unreachable";
  if (signals.error) return "error";
  if (signals.paused) return "paused";
  if (signals.busy) return signals.phase === "planning" ? "planning" : "moving";
  if (signals.completed) return "completed";
  return "idle";
}

export const ROBOT_STATE_LABEL: Record<RobotState, string> = {
  idle: "Boşta",
  planning: "Planlanıyor",
  moving: "Hareket ediyor",
  paused: "Duraklatıldı",
  completed: "Tamamlandı",
  error: "Hata",
  collision: "Çarpışma",
  unreachable: "Erişilemez",
};

export type RobotStateTone = "neutral" | "accent" | "success" | "warning" | "danger";

export const ROBOT_STATE_TONE: Record<RobotState, RobotStateTone> = {
  idle: "neutral",
  planning: "accent",
  moving: "accent",
  paused: "neutral",
  completed: "success",
  error: "danger",
  collision: "danger",
  unreachable: "warning",
};
