"use client";

import { useRef, useState } from "react";

interface ScanPathProps {
  /** Tarama satırı sayısı — az satır, satırlar arasında boşluk (kapsanmayan alan) bırakır. */
  rows?: number;
  /** Kullanıcı satır sayısını kendi ayarlayabilsin mi. */
  adjustableRows?: boolean;
  theme?: "universite";
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

const COLS = 12;
const CELL_PX = 28;
const STEP_MS = 120;
const MIN_ROWS = 2;
const MAX_ROWS = 10;

/** Boustrophedon (gidip-gelen/"öküz sabanı") tarama sırası: satır çift ise soldan sağa, tek ise sağdan sola. */
function buildScanOrder(rows: number): Array<{ col: number; row: number }> {
  const order: Array<{ col: number; row: number }> = [];
  for (let row = 0; row < rows; row++) {
    const cols = Array.from({ length: COLS }, (_, i) => i);
    if (row % 2 === 1) cols.reverse();
    for (const col of cols) order.push({ col, row });
  }
  return order;
}

/**
 * Ders içine gömülen etkileşimli sahne: bir lazer profil sensörünün
 * yüzey üzerinde gidip-gelerek (boustrophedon) tarama yaptığı sırayı
 * canlandırır, her geçtiği noktayı bir "nokta bulutu" hücresi olarak
 * biriktirir. `adjustableRows` açıksa satır sayısı azaltılıp taramanın
 * satırlar arasında boşluk bırakmasının (eksik kapsama) ne demek
 * olduğu gösterilebilir.
 */
export function ScanPath({ rows: initialRows = 6, adjustableRows = false, theme = "universite" }: ScanPathProps) {
  const t = THEME[theme];
  const [rows, setRows] = useState(initialRows);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
        if (index === order.length - 1) setScanning(false);
      }, index * STEP_MS);
      timeoutsRef.current.push(timeoutId);
    });
  }

  function handleReset() {
    stopScan();
    setVisited(new Set());
  }

  return (
    <div className={`flex flex-col gap-4 rounded-xl border ${t.border} ${t.surface} p-4`}>
      {/* Salt görsel ızgara; ilerleme aşağıdaki sayısal özette metin olarak var. */}
      <div
        aria-hidden="true"
        className={`grid w-fit gap-0.5 rounded-lg ${t.bg} p-2`}
        style={{ gridTemplateColumns: `repeat(${COLS}, ${CELL_PX}px)` }}
      >
        {Array.from({ length: rows * COLS }, (_, index) => {
          const col = index % COLS;
          const row = Math.floor(index / COLS);
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

      {adjustableRows && (
        <label className="flex flex-col gap-1 text-sm">
          <span className={t.inkMuted}>Tarama satırı sayısı: {rows}</span>
          <input
            type="range"
            min={MIN_ROWS}
            max={MAX_ROWS}
            value={rows}
            onChange={(event) => {
              stopScan();
              setVisited(new Set());
              setRows(Number(event.target.value));
            }}
            className="h-11 touch-none"
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
        Toplanan nokta sayısı: {visited.size} / {rows * COLS}
      </div>
    </div>
  );
}
