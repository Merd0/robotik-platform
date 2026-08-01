"use client";

import { markLessonComplete, unmarkLessonComplete, useLessonCompletion } from "@/lib/progress";

interface CompleteLessonButtonProps {
  slug: string;
}

export function CompleteLessonButton({ slug }: CompleteLessonButtonProps) {
  const completed = useLessonCompletion(slug);

  function toggle() {
    if (completed) unmarkLessonComplete(slug);
    else markLessonComplete(slug);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`h-11 rounded-md border px-4 text-sm ${
        completed
          ? "border-ortaokul-accent bg-ortaokul-accent/10 text-ortaokul-accent"
          : "border-ortaokul-ink/20"
      }`}
    >
      {completed ? "✓ Tamamlandı" : "Bu dersi tamamladım"}
    </button>
  );
}
