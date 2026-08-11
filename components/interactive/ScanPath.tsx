"use client";

import { useEffect, useRef, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import {
  buildScanOrder,
  MAX_SCAN_ROWS,
  MIN_SCAN_ROWS,
  SCAN_PATH_COLUMNS,
  scanDirectionAlternates,
} from "@/lib/scanPath";

interface ScanPathProps {
  /** Tarama satırı sayısı — az satır, satırlar arasında boşluk (kapsanmayan alan) bırakır. */
  rows?: number;
  /** Kullanıcı satır sayısını kendi ayarlayabilsin mi. */
  adjustableRows?: boolean;
  theme?: "universite";
  /** İki tamamlanmış tarama yoğunluğunu karşılaştıran sürümlü görev. */
  pilot?: "row-density-comparison";
}

const THEME = {
  universite: {
    border: "border-universite-ink/10",
    surface: "bg-universite-surface",
    bg: "bg-universite-bg",
    ink: "text-universite-ink",
    inkMuted: "text-universite-ink/70",
    button: "bg-universite-ink text-universite-surface",
    outline: "border-universite-ink/20",
    accent: "bg-universite-accent",
  },
} as const;

const CELL_PX = 28;
const STEP_MS = 120;

/**
 * Ders içine gömülen etkileşimli sahne: bir lazer profil sensörünün
 * yüzey üzerinde gidip-gelerek (boustrophedon) tarama yaptığı sırayı
 * canlandırır, her geçtiği noktayı bir "nokta bulutu" hücresi olarak
 * biriktirir. `adjustableRows` açıksa satır sayısı azaltılıp taramanın
 * satırlar arasında boşluk bırakmasının (eksik kapsama) ne demek
 * olduğu gösterilebilir.
 */
export function ScanPath({
  rows: initialRows = 6,
  adjustableRows = false,
  theme = "universite",
  pilot,
}: ScanPathProps) {
  const t = THEME[theme];
  const record = useEvidenceRecorder();
  const [rows, setRows] = useState(initialRows);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useSharedLabState("scan-path", (shared) => {
    if (shared.adjustableRows !== adjustableRows || (!adjustableRows && shared.rows !== initialRows)) return;
    stopScan();
    setRows(shared.rows);
    setVisited(new Set(shared.visited));
  });

  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  function stopScan() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setScanning(false);
  }

  function handleScan() {
    stopScan();
    setVisited(new Set());
    const order = buildScanOrder(rows);
    setScanning(true);
    order.forEach((point, index) => {
      const timeoutId = setTimeout(() => {
        setVisited((prev) => new Set(prev).add(`${point.col}-${point.row}`));
      }, index * STEP_MS);
      timeoutsRef.current.push(timeoutId);
    });
    const completionTimeout = setTimeout(() => {
      setScanning(false);
      if (pilot === "row-density-comparison") {
        record({
          skillId: "scan-row-density",
          stage: "observed",
          result: "success",
          metrics: {
            rows,
            pointCount: order.length,
            directionAlternates: scanDirectionAlternates(order, rows),
          },
        });
      }
    }, order.length * STEP_MS);
    timeoutsRef.current.push(completionTimeout);
  }

  function handleReset() {
    stopScan();
    setVisited(new Set());
  }

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      {/* Salt görsel ızgara; ilerleme aşağıdaki sayısal özette metin olarak var. */}
      <div className="overflow-x-auto overscroll-x-contain pb-2">
        <div
          aria-hidden="true"
          className={`grid w-fit gap-0.5 rounded-lg ${t.bg} p-2`}
          style={{ gridTemplateColumns: `repeat(${SCAN_PATH_COLUMNS}, ${CELL_PX}px)` }}
        >
          {Array.from({ length: rows * SCAN_PATH_COLUMNS }, (_, index) => {
            const col = index % SCAN_PATH_COLUMNS;
            const row = Math.floor(index / SCAN_PATH_COLUMNS);
            const on = visited.has(`${col}-${row}`);
            return (
              <div
                key={index}
                className={`rounded-sm ${on ? t.accent : "border border-dashed " + t.outline}`}
                style={{ width: CELL_PX, height: CELL_PX }}
              />
            );
          })}
        </div>
      </div>

      {adjustableRows && (
        <label className="flex flex-col gap-1 text-sm">
          <span className={t.inkMuted}>Tarama satırı sayısı: {rows}</span>
          <input
            type="range"
            min={MIN_SCAN_ROWS}
            max={MAX_SCAN_ROWS}
            value={rows}
            onChange={(event) => {
              stopScan();
              setVisited(new Set());
              setRows(Number(event.target.value));
            }}
            className="h-11 touch-pan-y"
          />
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className={`h-11 rounded-md px-4 ${t.button} disabled:opacity-50`}
        >
          {scanning ? "Taranıyor…" : "Tara"}
        </button>
        <button type="button" onClick={handleReset} className={`h-11 rounded-md border ${t.outline} px-4`}>
          Sıfırla
        </button>
      </div>

      <div role="status" className={`text-sm ${t.ink}`}>
        Toplanan nokta sayısı: {visited.size} / {rows * SCAN_PATH_COLUMNS}
      </div>

      <ExperimentShareButton
        seviye="universite"
        createShareUrl={() => createLabShareUrl({
          kind: "scan-path",
          version: 1,
          adjustableRows,
          rows,
          visited: [...visited].sort(),
        })}
      />
    </div>
  );
}
