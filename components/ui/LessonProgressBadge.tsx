"use client";

import { useLessonCompletion } from "@/lib/progress";

interface LessonProgressBadgeProps {
  slug: string;
}

export function LessonProgressBadge({ slug }: LessonProgressBadgeProps) {
  const completed = useLessonCompletion(slug);

  if (!completed) return null;
  return (
    <span aria-label="Tamamlandı" className="text-ortaokul-accent">
      ✓
    </span>
  );
}
