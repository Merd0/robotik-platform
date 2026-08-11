export const SCAN_PATH_COLUMNS = 12;
export const MIN_SCAN_ROWS = 2;
export const MAX_SCAN_ROWS = 10;

export interface ScanPoint {
  col: number;
  row: number;
}

/** Boustrophedon sıra: çift satır soldan sağa, tek satır sağdan sola. */
export function buildScanOrder(rows: number, columns = SCAN_PATH_COLUMNS): ScanPoint[] {
  if (!Number.isSafeInteger(rows) || rows < 1) throw new Error("rows pozitif güvenli tam sayı olmalı");
  if (!Number.isSafeInteger(columns) || columns < 1) throw new Error("columns pozitif güvenli tam sayı olmalı");

  const order: ScanPoint[] = [];
  for (let row = 0; row < rows; row++) {
    const cols = Array.from({ length: columns }, (_, index) => index);
    if (row % 2 === 1) cols.reverse();
    for (const col of cols) order.push({ col, row });
  }
  return order;
}

export function scanDirectionAlternates(order: readonly ScanPoint[], rows: number, columns = SCAN_PATH_COLUMNS): boolean {
  if (order.length !== rows * columns) return false;
  for (let row = 0; row < rows; row++) {
    const rowPoints = order.slice(row * columns, (row + 1) * columns);
    const expected = row % 2 === 0
      ? Array.from({ length: columns }, (_, index) => index)
      : Array.from({ length: columns }, (_, index) => columns - 1 - index);
    if (rowPoints.some((point, index) => point.row !== row || point.col !== expected[index])) return false;
  }
  return true;
}
