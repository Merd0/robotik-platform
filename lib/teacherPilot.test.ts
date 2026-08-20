import { describe, expect, it } from "vitest";
import { getPublicLessonBySlug } from "./content";
import { decodeLabState } from "./labState";
import {
  HAT_C_TEACHER_PILOT_LAB_STATE,
  HAT_C_TEACHER_PILOT_LESSON_SLUG,
  HAT_C_TEACHER_PILOT_TASK_URL,
  KOD_AKADEMISI_TEACHER_PILOT_MODULES,
  KOD_AKADEMISI_TEACHER_PILOT_TASK_URLS,
  TEACHER_PILOT_LAB_STATE,
  TEACHER_PILOT_LESSON_SLUG,
  TEACHER_PILOT_TASK_URL,
} from "./teacherPilot";
import { getPublicModuleBySlug } from "./kodAkademisi";

describe("öğretmen pilotu görev bağlantısı", () => {
  it("yayındaki Hat B dersini ve doğrulanabilir ön ayarı taşır", () => {
    const url = new URL(TEACHER_PILOT_TASK_URL);
    const encoded = new URLSearchParams(url.hash.slice(1)).get("lab");

    expect(url.pathname).toBe(`/ders/${TEACHER_PILOT_LESSON_SLUG}`);
    expect(encoded).not.toBeNull();
    expect(decodeLabState(encoded!)).toEqual({ ok: true, state: TEACHER_PILOT_LAB_STATE });
  });

  it("Hat B pilotunun işaret ettiği ders gerçekten yayında", () => {
    expect(getPublicLessonBySlug(TEACHER_PILOT_LESSON_SLUG)?.frontmatter.durum).toBe("yayinda");
  });
});

describe("öğretmen pilotu · Hat C görev bağlantısı", () => {
  it("yayındaki Hat C dersini ve doğrulanabilir ön ayarı taşır", () => {
    const url = new URL(HAT_C_TEACHER_PILOT_TASK_URL);
    const encoded = new URLSearchParams(url.hash.slice(1)).get("lab");

    expect(url.pathname).toBe(`/ders/${HAT_C_TEACHER_PILOT_LESSON_SLUG}`);
    expect(encoded).not.toBeNull();
    expect(decodeLabState(encoded!)).toEqual({ ok: true, state: HAT_C_TEACHER_PILOT_LAB_STATE });
  });

  it("Hat C pilotunun işaret ettiği ders gerçekten yayında", () => {
    expect(getPublicLessonBySlug(HAT_C_TEACHER_PILOT_LESSON_SLUG)?.frontmatter.durum).toBe("yayinda");
  });

  it("engel düzeni geçerli bir planner-race durumu", () => {
    expect(HAT_C_TEACHER_PILOT_LAB_STATE.algorithms).toEqual(["astar", "rrt", "rrt_star"]);
    expect(HAT_C_TEACHER_PILOT_LAB_STATE.obstacles.length).toBeGreaterThan(0);
  });
});

describe("öğretmen pilotu · Kod Akademisi modül bağlantıları", () => {
  it("üç modül URL'i de kendi modül sırasıyla eşleşir", () => {
    expect(KOD_AKADEMISI_TEACHER_PILOT_TASK_URLS).toHaveLength(KOD_AKADEMISI_TEACHER_PILOT_MODULES.length);
    KOD_AKADEMISI_TEACHER_PILOT_MODULES.forEach((pilotModule, index) => {
      expect(KOD_AKADEMISI_TEACHER_PILOT_TASK_URLS[index]).toBe(
        `${new URL(KOD_AKADEMISI_TEACHER_PILOT_TASK_URLS[index]).origin}/kod-akademisi/${pilotModule.asama}/${pilotModule.modul}`,
      );
    });
  });

  it("üç modül de gerçekten var ve yayında", () => {
    for (const pilotModule of KOD_AKADEMISI_TEACHER_PILOT_MODULES) {
      const found = getPublicModuleBySlug(pilotModule.modul);
      expect(found, `${pilotModule.modul} bulunamadı`).toBeDefined();
      expect(found?.frontmatter.asama).toBe(pilotModule.asama);
      expect(found?.frontmatter.skillId).toBe(pilotModule.skillId);
    }
  });
});
