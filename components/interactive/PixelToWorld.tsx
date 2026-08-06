"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";

interface PixelToWorldProps {
  /** Varsayılan kalibrasyon: 1 pikselin gerçek dünyada kaç milimetreye karşılık geldiği. */
  mmPerPixel?: number;
  /** Kullanıcı kalibrasyon değerini kendi ayarlayabilsin mi. */
  adjustableCalibration?: boolean;
  /** "Perspektif hatası göster" anahtarını göster — merkezden uzaklaştıkça ölçüm kayması ekler. */
  allowPerspectiveDistortion?: boolean;
  theme?: "ortaokul" | "lise" | "universite";
}

const THEME = {
  ortaokul: {
    border: "border-ortaokul-ink/10",
    surface: "bg-ortaokul-surface",
    bg: "bg-ortaokul-bg",
    ink: "text-ortaokul-ink",
    inkMuted: "text-ortaokul-ink/70",
    outline: "border-ortaokul-ink/20",
    accent: "bg-ortaokul-accent",
  },
  lise: {
    border: "border-lise-ink/10",
    surface: "bg-lise-surface",
    bg: "bg-lise-bg",
    ink: "text-lise-ink",
    inkMuted: "text-lise-ink/70",
    outline: "border-lise-ink/20",
    accent: "bg-lise-accent",
  },
  universite: {
    border: "border-universite-ink/10",
    surface: "bg-universite-surface",
    bg: "bg-universite-bg",
    ink: "text-universite-ink",
    inkMuted: "text-universite-ink/70",
    outline: "border-universite-ink/20",
    accent: "bg-universite-accent",
  },
} as const;

const GRID_SIZE = 8;
const OBJECT_COL = 5;
const OBJECT_ROW = 2;
const PIXELS_PER_CELL = 10;

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Ders içine gömülen etkileşimli sahne: bir "kamera görüntüsü" ızgarası —
 * kullanıcı bir hücreye (nesnenin üstüne) tıklar, o hücrenin piksel
 * koordinatı ve kalibrasyona göre hesaplanan gerçek dünya (mm) konumu
 * gösterilir. `allowPerspectiveDistortion` açıksa merkezden uzaklaştıkça
 * hesaba kasıtlı bir kayma eklenir — "aynı kalibrasyonu her yerde
 * kullanmanın" neden hataya yol açabileceğini somutlaştırır.
 */
export function PixelToWorld({
  mmPerPixel = 5,
  adjustableCalibration = false,
  allowPerspectiveDistortion = false,
  theme = "lise",
}: PixelToWorldProps) {
  const t = THEME[theme];
  const [selected, setSelected] = useState<{ col: number; row: number } | null>(null);
  const [calibration, setCalibration] = useState(mmPerPixel);
  const [showDistortion, setShowDistortion] = useState(false);

  function selectCell(col: number, row: number) {
    setSelected({
      col: Math.max(0, Math.min(GRID_SIZE - 1, col)),
      row: Math.max(0, Math.min(GRID_SIZE - 1, row)),
    });
  }

  function handleGridClick(event: MouseEvent<HTMLButtonElement>) {
    // Enter/Space ile üretilen sentetik tıklamada koordinat yoktur. İlk
    // klavye etkileşimini anlamlı varsayılan olan nesne hücresinden başlat.
    if (event.detail === 0) {
      setSelected((current) => current ?? { col: OBJECT_COL, row: OBJECT_ROW });
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    selectCell(
      Math.floor(((event.clientX - bounds.left) / bounds.width) * GRID_SIZE),
      Math.floor(((event.clientY - bounds.top) / bounds.height) * GRID_SIZE),
    );
  }

  function handleGridKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const current = selected ?? { col: OBJECT_COL, row: OBJECT_ROW };
    const directions: Partial<Record<string, { col: number; row: number }>> = {
      ArrowLeft: { col: -1, row: 0 },
      ArrowRight: { col: 1, row: 0 },
      ArrowUp: { col: 0, row: -1 },
      ArrowDown: { col: 0, row: 1 },
    };
    const direction = directions[event.key];
    if (!direction) return;

    event.preventDefault();
    selectCell(current.col + direction.col, current.row + direction.row);
  }

  function computeWorld(col: number, row: number) {
    const pixelX = col * PIXELS_PER_CELL;
    const pixelY = row * PIXELS_PER_CELL;
    let effectiveCalibration = calibration;
    if (allowPerspectiveDistortion && showDistortion) {
      const center = (GRID_SIZE - 1) / 2;
      const distanceFromCenter = Math.hypot(col - center, row - center);
      effectiveCalibration = calibration * (1 + distanceFromCenter * 0.06);
    }
    return {
      pixelX,
      pixelY,
      worldX: round(pixelX * effectiveCalibration),
      worldY: round(pixelY * effectiveCalibration),
    };
  }

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      <div className={`w-full max-w-92 rounded-lg ${t.bg} p-2`}>
        <button
          type="button"
          onClick={handleGridClick}
          onKeyDown={handleGridKeyDown}
          aria-label={
            selected
              ? `Piksel ızgarası. Seçili hücre: sütun ${selected.col}, satır ${selected.row}. Ok tuşlarıyla gez.`
              : "Piksel ızgarası. Bir hücre seç veya ok tuşlarıyla gez."
          }
          className="grid aspect-square w-full grid-cols-8 gap-0.5 rounded"
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
            const col = index % GRID_SIZE;
            const row = Math.floor(index / GRID_SIZE);
            const isObject = col === OBJECT_COL && row === OBJECT_ROW;
            const isSelected = selected?.col === col && selected?.row === row;
            return (
              <span
                key={index}
                aria-hidden="true"
                className={`flex aspect-square min-w-0 items-center justify-center rounded border ${
                  isSelected ? "border-2" : "border"
                } ${t.outline}`}
              >
                {isObject && <span className={`h-4 w-4 rounded-full ${t.accent}`} />}
              </span>
            );
          })}
        </button>
      </div>

      {adjustableCalibration && (
        <label className="flex flex-col gap-1 text-sm">
          <span className={t.inkMuted}>Kalibrasyon: 1 piksel = {calibration} mm</span>
          <input
            type="range"
            min={1}
            max={15}
            step={0.5}
            value={calibration}
            onChange={(event) => setCalibration(Number(event.target.value))}
            className="h-11 touch-pan-y"
          />
        </label>
      )}

      {allowPerspectiveDistortion && (
        <label className="flex h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={showDistortion}
            onChange={(event) => setShowDistortion(event.target.checked)}
          />
          Perspektif hatasını göster
        </label>
      )}

      <div role="status" aria-live="polite" className={`text-sm ${t.ink}`}>
        {selected ? (
          (() => {
            const { pixelX, pixelY, worldX, worldY } = computeWorld(selected.col, selected.row);
            return (
              <>
                <div>
                  Piksel: ({pixelX}, {pixelY})
                </div>
                <div>
                  Hesaplanan gerçek konum: ({worldX} mm, {worldY} mm)
                </div>
              </>
            );
          })()
        ) : (
          <span className={t.inkMuted}>Bir hücreye tıkla — özellikle nesnenin üstüne.</span>
        )}
      </div>
    </div>
  );
}
