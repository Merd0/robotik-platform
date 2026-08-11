"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import { PIXEL_GRID_SIZE, pixelToWorld } from "@/lib/pixelToWorld";

interface PixelToWorldProps {
  /** Varsayılan kalibrasyon: 1 pikselin gerçek dünyada kaç milimetreye karşılık geldiği. */
  mmPerPixel?: number;
  /** Kullanıcı kalibrasyon değerini kendi ayarlayabilsin mi. */
  adjustableCalibration?: boolean;
  /** "Perspektif hatası göster" anahtarını göster — merkezden uzaklaştıkça ölçüm kayması ekler. */
  allowPerspectiveDistortion?: boolean;
  theme?: "ortaokul" | "lise" | "universite";
  /** Aynı çevresel hücreyi bozulma kapalı/açık karşılaştıran sürümlü görev. */
  pilot?: "distortion-comparison";
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

const OBJECT_COL = 5;
const OBJECT_ROW = 2;

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
  pilot,
}: PixelToWorldProps) {
  const t = THEME[theme];
  const record = useEvidenceRecorder();
  const [selected, setSelected] = useState<{ col: number; row: number } | null>(null);
  const [calibration, setCalibration] = useState(mmPerPixel);
  const [showDistortion, setShowDistortion] = useState(false);

  useSharedLabState("pixel-to-world", (shared) => {
    if (
      shared.adjustableCalibration !== adjustableCalibration ||
      shared.allowPerspectiveDistortion !== allowPerspectiveDistortion ||
      (!adjustableCalibration && shared.calibration !== mmPerPixel)
    ) return;
    setSelected(shared.selected);
    setCalibration(shared.calibration);
    setShowDistortion(shared.showDistortion);
  });

  function recordObservation(cell: { col: number; row: number }, distortion: boolean) {
    if (pilot !== "distortion-comparison") return;
    const result = pixelToWorld(cell.col, cell.row, calibration, distortion);
    const peripheral = result.distanceFromCenter >= 3;
    record({
      skillId: "camera-distortion-comparison",
      stage: "observed",
      result: peripheral ? "success" : "retry",
      metrics: {
        cell: `${cell.col},${cell.row}`,
        distortion,
        worldX: result.worldX,
        worldY: result.worldY,
        distanceFromCenter: result.distanceFromCenter,
      },
    });
  }

  function selectCell(col: number, row: number) {
    const next = {
      col: Math.max(0, Math.min(PIXEL_GRID_SIZE - 1, col)),
      row: Math.max(0, Math.min(PIXEL_GRID_SIZE - 1, row)),
    };
    setSelected(next);
    recordObservation(next, showDistortion);
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
      Math.floor(((event.clientX - bounds.left) / bounds.width) * PIXEL_GRID_SIZE),
      Math.floor(((event.clientY - bounds.top) / bounds.height) * PIXEL_GRID_SIZE),
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
          {Array.from({ length: PIXEL_GRID_SIZE * PIXEL_GRID_SIZE }, (_, index) => {
            const col = index % PIXEL_GRID_SIZE;
            const row = Math.floor(index / PIXEL_GRID_SIZE);
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
            onChange={(event) => {
              const next = event.target.checked;
              setShowDistortion(next);
              if (selected) recordObservation(selected, next);
            }}
          />
          Perspektif hatasını göster
        </label>
      )}

      <div role="status" aria-live="polite" className={`text-sm ${t.ink}`}>
        {selected ? (
          (() => {
            const { pixelX, pixelY, worldX, worldY } = pixelToWorld(
              selected.col,
              selected.row,
              calibration,
              allowPerspectiveDistortion && showDistortion,
            );
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

      <ExperimentShareButton
        seviye={theme}
        createShareUrl={() => createLabShareUrl({
          kind: "pixel-to-world",
          version: 1,
          adjustableCalibration,
          allowPerspectiveDistortion,
          calibration,
          selected,
          showDistortion,
        })}
      />
    </div>
  );
}
