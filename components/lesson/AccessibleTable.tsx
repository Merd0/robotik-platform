import type { ComponentPropsWithoutRef } from "react";

type AccessibleTableProps = ComponentPropsWithoutRef<"table">;

/**
 * MDX'teki Markdown tablolarını klavyeyle yatay kaydırılabilir bir sarmalayıcıya
 * alır. `<table>` üzerinde `width`/`max-width` tek başına yeterli değil — auto
 * table-layout, sütun min-content genişliği sarmalayıcıdan büyükse tabloyu o
 * genişliğe zorlar (Bootstrap'in `.table-responsive`'i aynı nedenle sarmalayıcı
 * kullanır). Sonuç: font metriği platforma göre değiştiğinde (ör. Linux CI'da
 * Türkçe karakterlerin genişliği Windows'tan farklı ölçülüyor) tablo sayfayı
 * yatayda taşırabiliyordu — bkz. a-universite-dh-parametreleri, 2026-08-12.
 */
export function AccessibleTable({ children, "aria-label": ariaLabel, ...props }: AccessibleTableProps) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={ariaLabel ?? "Veri tablosu"}
      className="ders-tablo-scroll min-w-0 max-w-full overflow-x-auto overscroll-x-contain"
    >
      <table {...props}>{children}</table>
    </div>
  );
}
