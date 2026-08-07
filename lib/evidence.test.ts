import { describe, expect, it } from "vitest";
import { summarizeEvidence, type EvidenceEvent } from "./evidence";

const event = (stage: EvidenceEvent["stage"], result: EvidenceEvent["result"] = "neutral"): EvidenceEvent => ({
  id: stage,
  lessonId: "ders-1",
  skillId: "beceri-1",
  stage,
  result,
  contentVersion: "v1",
  createdAt: "2026-08-07T00:00:00.000Z",
});

describe("kanıt özeti", () => {
  it("okundu, denendi ve kanıtlandı aşamalarını birbirine karıştırmaz", () => {
    expect(summarizeEvidence([event("read")], "ders-1")).toMatchObject({ read: true, tried: false, passed: false });
    expect(summarizeEvidence([event("read"), event("tried")], "ders-1")).toMatchObject({ read: true, tried: true, passed: false });
    expect(summarizeEvidence([event("passed", "success")], "ders-1")).toMatchObject({ read: true, tried: true, passed: true });
  });

  it("başarısız transferi başarı saymaz", () => {
    expect(summarizeEvidence([event("transferred", "retry"), event("passed", "retry")], "ders-1").passed).toBe(false);
  });
});
