"use client";

import { markLessonComplete, unmarkLessonComplete, useLessonCompletion } from "@/lib/progress";
import type { Seviye } from "@/lib/content";
import { SEVIYE_THEME } from "@/lib/seviyeTheme";

interface CompleteLessonButtonProps {
  slug: string;
  seviye: Seviye;
}

export function CompleteLessonButton({ slug, seviye }: CompleteLessonButtonProps) {
  const completed = useLessonCompletion(slug);
  const theme = SEVIYE_THEME[seviye];

  function toggle() {
    if (completed) unmarkLessonComplete(slug);
    else markLessonComplete(slug);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`h-11 rounded-md border px-4 text-sm ${
        completed ? theme.completed : `${theme.border} ${theme.ink}`
      }`}
    >
      {completed ? "✓ Tamamlandı" : "Bu dersi tamamladım"}
    </button>
  );
}
