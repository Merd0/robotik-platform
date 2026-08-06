"use client";

import { useLessonCompletion } from "@/lib/progress";
import type { Seviye } from "@/lib/content";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

interface LessonProgressBadgeProps {
  slug: string;
  seviye: Seviye;
}

export function LessonProgressBadge({ slug, seviye }: LessonProgressBadgeProps) {
  const completed = useLessonCompletion(slug);

  if (!completed) return null;
  return (
    <span aria-label="Tamamlandı" className={SEVIYE_THEME[seviye].accentText}>
      ✓
    </span>
  );
}
