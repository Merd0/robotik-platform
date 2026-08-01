import { useSyncExternalStore } from "react";

const STORAGE_KEY = "robotik-platform:tamamlanan-dersler";
const listeners = new Set<() => void>();

/**
 * İlerleme sadece tarayıcının localStorage'ında tutulur. Hesap, sunucu
 * isteği veya çerez yok — bkz. CLAUDE.md "Kişisel veri toplanmaz".
 */
function readCompletedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeCompletedIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  listeners.forEach((listener) => listener());
}

export function isLessonComplete(slug: string): boolean {
  return readCompletedIds().includes(slug);
}

export function markLessonComplete(slug: string): void {
  const ids = readCompletedIds();
  if (!ids.includes(slug)) writeCompletedIds([...ids, slug]);
}

export function unmarkLessonComplete(slug: string): void {
  writeCompletedIds(readCompletedIds().filter((id) => id !== slug));
}

export function getCompletedLessonIds(): string[] {
  return readCompletedIds();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

/** SSR-güvenli: sunucuda her zaman "tamamlanmamış" döner, istemcide hidrasyon sonrası gerçek değere geçer. */
export function useLessonCompletion(slug: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isLessonComplete(slug),
    () => false,
  );
}
