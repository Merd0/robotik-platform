export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "robotik-tema";

export function resolveThemePreference(stored: string | null, systemDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return systemDark ? "dark" : "light";
}

export const SCENE_PALETTES = {
  light: {
    background: "#f8fafc",
    link: "#334155",
    accent: "#0f766e",
    grid: "#94a3b8",
    gridSection: "#64748b",
    obstacle: "#475569",
    ellipse: "#475569",
    start: "#0f766e",
    goal: "#dc2626",
    astar: "#0f766e",
    rrt: "#b45309",
    rrtStar: "#6d28d9",
    jointPrimary: "#0f766e",
    jointSecondary: "#c2410c",
    reachable: "#0f766e",
    unreachable: "#dc2626",
    axisX: "#dc2626",
    axisY: "#16a34a",
    axisZ: "#2563eb",
    activeAxis: "#d97706",
  },
  dark: {
    background: "#071418",
    link: "#cbd5e1",
    accent: "#5eead4",
    grid: "#475569",
    gridSection: "#94a3b8",
    obstacle: "#94a3b8",
    ellipse: "#cbd5e1",
    start: "#5eead4",
    goal: "#f87171",
    astar: "#5eead4",
    rrt: "#fbbf24",
    rrtStar: "#c4b5fd",
    jointPrimary: "#5eead4",
    jointSecondary: "#fdba74",
    reachable: "#5eead4",
    unreachable: "#f87171",
    axisX: "#f87171",
    axisY: "#4ade80",
    axisZ: "#60a5fa",
    activeAxis: "#fbbf24",
  },
} as const satisfies Record<Theme, Record<string, string>>;
