"use client";

import { useMemo, useState } from "react";

interface ThresholdViewerProps {
  theme?: "lise" | "universite";
}

const THEME = {
  lise: {
    border: "border-lise-ink/10",
    surface: "bg-lise-surface",
    bg: "bg-lise-bg",
    ink: "text-lise-ink",
    inkMuted: "text-lise-ink/70",
    accent: "bg-lise-accent",
  },
  universite: {
    border: "border-universite-ink/10",
    surface: "bg-universite-surface",
    bg: "bg-universite-bg",
    ink: "text-universite-ink",
    inkMuted: "text-universite-ink/70",
    accent: "bg-universite-accent",
  },
} as const;

const COLS = 12;
const ROWS = 8;
const CELL_PX = 28;
const CENTER_COL = 6;
const CENTER_ROW = 4;
const OBJECT_RADIUS = 2.4;

/**
 * Sabit (deterministik — sunucu/istemci arasında tutarlı, Math.random
 * kullanılmıyor) bir parlaklık ızgarası: ortada bir "nesne" (yüksek
 * parlaklık), etrafında gürültülü bir arka plan. Eşik değeri gerçek
 * nesnenin parlaklığının altına inerse gürültü de "nesne" sayılır,
 * üstüne çıkarsa nesnenin kendisi de kaybolur.
 */
function computeBrightness(col: number, row: number): number {
  const distance = Math.hypot(col - CENTER_COL, row - CENTER_ROW);
  const base = distance < OBJECT_RADIUS ? 200 : 70;
  const pseudoNoise = ((col * 31 + row * 17) % 23) - 11;
  return Math.min(255, Math.max(0, base + pseudoNoise));
}

/**
 * Ders içine gömülen etkileşimli sahne: bir eşik (threshold) kaydırıcısı
 * ile parlaklık ızgarasındaki hangi hücrelerin "nesne" sayılacağını
 * belirle. Doğru eşik nesneyi net ortaya çıkarır; çok düşük eşik gürültüyü
 * de nesne sayar, çok yüksek eşik nesneyi de gürültüyle birlikte siler.
 */
export function ThresholdViewer({ theme = "lise" }: ThresholdViewerProps) {
  const t = THEME[theme];
  const [threshold, setThreshold] = useState(128);

  const brightness = useMemo(
    () =>
      Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLS }, (_, col) => computeBrightness(col, row))),
    [],
  );

  const detectedCount = brightness.flat().filter((value) => value >= threshold).length;

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      {/* Salt görsel ızgara; bilgi içeriği aşağıdaki sayısal özette metin olarak var. */}
      <div
        aria-hidden="true"
        className={`grid w-fit gap-0.5 rounded-lg ${t.bg} p-2`}
        style={{ gridTemplateColumns: `repeat(${COLS}, ${CELL_PX}px)` }}
      >
        {brightness.flatMap((rowValues, row) =>
          rowValues.map((value, col) => {
            const on = value >= threshold;
            return (
              <div
                key={`${row}-${col}`}
                className={on ? t.accent : "bg-black/70"}
                style={{ width: CELL_PX, height: CELL_PX }}
              />
            );
          }),
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className={t.inkMuted}>Eşik değeri: {threshold} (0–255)</span>
        <input
          type="range"
          min={0}
          max={255}
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
          className="h-11 touch-pan-y"
        />
      </label>

      <div role="status" className={`text-sm ${t.ink}`}>
        Eşiğin üstünde kalan hücre sayısı: {detectedCount} / {ROWS * COLS}
      </div>
    </div>
  );
}
