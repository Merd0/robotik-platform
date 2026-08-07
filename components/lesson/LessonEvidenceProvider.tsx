"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import { appendEvidence, EMPTY_EVIDENCE, getEvidenceEvents, subscribeEvidence, summarizeEvidence, type EvidenceResult, type EvidenceStage } from "@/lib/evidence";

interface EvidenceInput {
  skillId: string;
  stage: EvidenceStage;
  result?: EvidenceResult;
  metrics?: Record<string, number | string | boolean>;
  attempts?: number;
  seed?: number;
}

interface EvidenceContextValue {
  lessonId: string;
  contentVersion: string;
  record: (input: EvidenceInput) => void;
}

const EvidenceContext = createContext<EvidenceContextValue | null>(null);

export function LessonEvidenceProvider({ lessonId, contentVersion, children }: { lessonId: string; contentVersion: string; children: ReactNode }) {
  const record = useCallback((input: EvidenceInput) => {
    appendEvidence({ lessonId, contentVersion, result: input.result ?? "neutral", ...input });
  }, [lessonId, contentVersion]);
  return <EvidenceContext.Provider value={{ lessonId, contentVersion, record }}>{children}</EvidenceContext.Provider>;
}

export function useEvidenceRecorder() {
  const context = useContext(EvidenceContext);
  return context?.record ?? (() => undefined);
}

export function useLessonEvidence(lessonId?: string) {
  const context = useContext(EvidenceContext);
  const targetLesson = lessonId ?? context?.lessonId ?? "";
  const events = useSyncExternalStore(subscribeEvidence, getEvidenceEvents, () => EMPTY_EVIDENCE);
  return summarizeEvidence(events, targetLesson);
}
