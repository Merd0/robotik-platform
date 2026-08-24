import {
  ROBOT_STATE_LABEL,
  ROBOT_STATE_TONE,
  type RobotState,
  type RobotStateTone,
} from "@/lib/robotics/robotState";

/**
 * Paylaşılan robot durum rozeti (docs/16-urun-denetimi.md Madde 28).
 * Her etkileşimli bileşenin kendi ad-hoc durum metnini basmasının yanına
 * (veya yerine) eklenen, tutarlı bir görsel dil. Renk tek başına anlam
 * taşımaz — etiket metni her zaman görünür (bkz. docs/02 "erişilebilirlik").
 */

const TONE_CLASS: Record<RobotStateTone, string> = {
  neutral: "border-site-border bg-site-surface text-site-muted",
  accent: "border-site-border bg-site-surface text-site-accent-text",
  success: "border-success-border bg-success-surface text-success-ink",
  warning: "border-warning-border bg-warning-surface text-warning-ink",
  danger: "border-danger-border bg-danger-surface text-danger-ink",
};

/**
 * Salt görsel rozet — `aria-live` taşımaz. Genelde yanına konduğu bileşen
 * (ör. CodeRunner'ın `role="status"` metni) zaten canlı bölgeyi sağlıyor;
 * iki canlı bölge aynı anda değişirse ekran okuyucuya aynı bilgi iki kez
 * okunur. Rozetin kendi başına tek durum göstergesi olduğu bir yerde
 * kullanılıyorsa çağıran taraf `role="status"`u kendi sarmalayıcısına ekler.
 */
export function RobotStateBadge({ state, className = "" }: { state: RobotState; className?: string }) {
  const tone = ROBOT_STATE_TONE[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-semibold ${TONE_CLASS[tone]} ${className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {ROBOT_STATE_LABEL[state]}
    </span>
  );
}
