import type { Seviye } from "@/lib/content";

interface SeviyeTheme {
  page: string;
  surface: string;
  ink: string;
  muted: string;
  accentText: string;
  border: string;
  completed: string;
}

export const SEVIYE_THEME = {
  ortaokul: {
    page: "bg-ortaokul-bg text-ortaokul-ink",
    surface: "bg-ortaokul-surface",
    ink: "text-ortaokul-ink",
    muted: "text-ortaokul-ink/70",
    accentText: "text-ortaokul-accent-text",
    border: "border-ortaokul-ink/15",
    completed: "border-ortaokul-accent bg-ortaokul-accent/10 text-ortaokul-accent-text",
  },
  lise: {
    page: "bg-lise-bg text-lise-ink",
    surface: "bg-lise-surface",
    ink: "text-lise-ink",
    muted: "text-lise-ink/70",
    accentText: "text-lise-accent-text",
    border: "border-lise-ink/15",
    completed: "border-lise-accent bg-lise-accent/10 text-lise-accent-text",
  },
  universite: {
    page: "bg-universite-bg text-universite-ink",
    surface: "bg-universite-surface",
    ink: "text-universite-ink",
    muted: "text-universite-ink/70",
    accentText: "text-universite-accent-text",
    border: "border-universite-ink/15",
    completed: "border-universite-accent bg-universite-accent/10 text-universite-accent-text",
  },
} satisfies Record<Seviye, SeviyeTheme>;
