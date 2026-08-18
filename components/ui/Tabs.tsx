"use client";

import { useRef, type ReactNode } from "react";

/**
 * Paylaşılan erişilebilir sekme grubu. CustomRobotPlayground ve
 * RobotCellStudio'da bağımsız olarak iki kez yazılmış aynı deseni
 * (role=tablist/tab, ok tuşu gezintisi, roving tabIndex) tek yerde toplar
 * (bkz. docs/durum-codex.md "Kod Akademisi — mimari teklif").
 *
 * Kaydırma/odak dışındaki yan etkiler (ör. panel içeriğini sıfırlama)
 * çağıranın `onSelect` sarmalayıcısına bırakılır — bu bileşen yalnız
 * sekme mekaniğinden sorumludur.
 */
export interface TabItem {
  id: string;
  label: string;
  shortLabel?: string;
  badge?: ReactNode;
}

interface TabsProps {
  items: readonly TabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
  idPrefix: string;
  className?: string;
  tabClassName?: (active: boolean) => string;
}

const NAV_KEYS = ["ArrowLeft", "ArrowRight", "Home", "End"] as const;

export function Tabs({ items, activeId, onSelect, ariaLabel, idPrefix, className, tabClassName }: TabsProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!NAV_KEYS.includes(event.key as (typeof NAV_KEYS)[number])) return;
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    const nextItem = items[nextIndex];
    onSelect(nextItem.id);
    // Her sekme düğmesi (aktif panel ne olursa olsun) her zaman DOM'da —
    // hedef zaten var, bir sonraki state güncellemesini/frame'i beklemeye
    // gerek yok. Senkron odak, requestAnimationFrame'in arka planda/gizli
    // sekmede hiç ateşlenmeyebilme riskini de ortadan kaldırır.
    tabRefs.current[nextItem.id]?.focus({ preventScroll: true });
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={className}>
      {items.map((item, index) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            ref={(element) => {
              tabRefs.current[item.id] = element;
            }}
            id={`${idPrefix}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={tabClassName ? tabClassName(active) : undefined}
          >
            {item.shortLabel ? (
              <>
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
              </>
            ) : (
              item.label
            )}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  idPrefix: string;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}

export function TabPanel({ id, idPrefix, ariaLabel, className, children }: TabPanelProps) {
  return (
    <div
      id={`${idPrefix}-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`${idPrefix}-tab-${id}`}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </div>
  );
}
