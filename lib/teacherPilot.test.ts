import { describe, expect, it } from "vitest";
import { decodeLabState } from "./labState";
import {
  TEACHER_PILOT_LAB_STATE,
  TEACHER_PILOT_LESSON_SLUG,
  TEACHER_PILOT_TASK_URL,
} from "./teacherPilot";

describe("öğretmen pilotu görev bağlantısı", () => {
  it("yayındaki Hat B dersini ve doğrulanabilir ön ayarı taşır", () => {
    const url = new URL(TEACHER_PILOT_TASK_URL);
    const encoded = new URLSearchParams(url.hash.slice(1)).get("lab");

    expect(url.pathname).toBe(`/ders/${TEACHER_PILOT_LESSON_SLUG}`);
    expect(encoded).not.toBeNull();
    expect(decodeLabState(encoded!)).toEqual({ ok: true, state: TEACHER_PILOT_LAB_STATE });
  });
});
