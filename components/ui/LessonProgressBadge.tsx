"use client";

import { useLessonEvidence } from "@/components/lesson/LessonEvidenceProvider";
import type { Seviye } from "@/lib/content";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

interface LessonProgressBadgeProps {
  slug: string;
  seviye: Seviye;
  contentVersion: string;
}

export function LessonProgressBadge({ slug, seviye, contentVersion }: LessonProgressBadgeProps) {
  const evidence = useLessonEvidence(slug, contentVersion);
  if (!evidence.read) return <span className="text-xs text-site-subtle">Başlanmadı</span>;
  return (
    <span aria-label={evidence.passed ? "Kanıtlandı" : evidence.tried ? "Denendi" : "Okundu"} className={`whitespace-nowrap text-xs font-semibold ${SEVIYE_THEME[seviye].accentText}`}>
      {evidence.passed ? "✓ Kanıtlandı" : evidence.tried ? "◐ Denendi" : "○ Okundu"}
    </span>
  );
}
