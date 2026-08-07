export type EvidenceStage = "read" | "predicted" | "tried" | "observed" | "transferred" | "passed";
export type EvidenceResult = "success" | "retry" | "neutral";

export interface EvidenceEvent {
  id: string;
  lessonId: string;
  skillId: string;
  stage: EvidenceStage;
  result: EvidenceResult;
  metrics?: Record<string, number | string | boolean>;
  attempts?: number;
  seed?: number;
  contentVersion: string;
  createdAt: string;
}

export interface EvidenceSummary {
  read: boolean;
  tried: boolean;
  passed: boolean;
  eventCount: number;
  lastEvent?: EvidenceEvent;
}

export const EVIDENCE_STORAGE_KEY = "robotik-platform:evidence:v1";
export const EMPTY_EVIDENCE: readonly EvidenceEvent[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedEvents: readonly EvidenceEvent[] = EMPTY_EVIDENCE;

export function getEvidenceEvents(): readonly EvidenceEvent[] {
  if (typeof window === "undefined") return EMPTY_EVIDENCE;
  const raw = window.localStorage.getItem(EVIDENCE_STORAGE_KEY);
  if (raw === cachedRaw) return cachedEvents;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedEvents = Array.isArray(parsed) ? parsed : EMPTY_EVIDENCE;
  } catch {
    cachedEvents = EMPTY_EVIDENCE;
  }
  return cachedEvents;
}

export function appendEvidence(input: Omit<EvidenceEvent, "id" | "createdAt">): EvidenceEvent | null {
  if (typeof window === "undefined") return null;
  const event: EvidenceEvent = {
    ...input,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [...getEvidenceEvents(), event].slice(-500);
  const raw = JSON.stringify(next);
  window.localStorage.setItem(EVIDENCE_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedEvents = next;
  listeners.forEach((listener) => listener());
  return event;
}

export function subscribeEvidence(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", listener);
  };
}

export function summarizeEvidence(events: readonly EvidenceEvent[], lessonId: string): EvidenceSummary {
  const lessonEvents = events.filter((event) => event.lessonId === lessonId);
  return {
    read: lessonEvents.some((event) => ["read", "predicted", "tried", "observed", "transferred", "passed"].includes(event.stage)),
    tried: lessonEvents.some((event) => ["tried", "observed", "transferred", "passed"].includes(event.stage)),
    passed: lessonEvents.some((event) => event.stage === "passed" && event.result === "success"),
    eventCount: lessonEvents.length,
    lastEvent: lessonEvents.at(-1),
  };
}
