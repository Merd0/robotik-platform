"use client";

import { useLessonEvidence } from "@/components/lesson/LessonEvidenceProvider";
import type { Seviye } from "@/lib/content";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

interface LessonProgressBadgeProps {
  slug: string;
  seviye: Seviye;
}

export function LessonProgressBadge({ slug, seviye }: LessonProgressBadgeProps) {
  const evidence = useLessonEvidence(slug);
  if (!evidence.read) return <span className="text-xs text-site-subtle">Başlanmadı</span>;
  return (
    <span aria-label={evidence.passed ? "Kanıtlandı" : evidence.tried ? "Denendi" : "Okundu"} className={`whitespace-nowrap text-xs font-semibold ${SEVIYE_THEME[seviye].accentText}`}>
      {evidence.passed ? "✓ Kanıtlandı" : evidence.tried ? "◐ Denendi" : "○ Okundu"}
    </span>
  );
}
