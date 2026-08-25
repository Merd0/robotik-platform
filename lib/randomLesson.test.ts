import { describe, expect, it } from "vitest";
import { pickRandomLessonId } from "./randomLesson";

describe("pickRandomLessonId", () => {
  it("boş listede null döner", () => {
    expect(pickRandomLessonId([], undefined, () => 0)).toBeNull();
  });

  it("random() 0 ile ilk elemanı, sona yakın bir değerle son elemanı seçebilir", () => {
    const ids = ["a", "b", "c"];
    expect(pickRandomLessonId(ids, undefined, () => 0)).toBe("a");
    expect(pickRandomLessonId(ids, undefined, () => 0.99)).toBe("c");
  });

  it("tek elemanlı listede o eleman hariç tutulmaya çalışılsa bile onu döner (başka seçenek yok)", () => {
    expect(pickRandomLessonId(["tek"], "tek", () => 0)).toBe("tek");
  });

  it("mevcut dersi (excludeId) listeden çıkarıp kalanlardan seçer", () => {
    const ids = ["a", "b", "c"];
    const result = pickRandomLessonId(ids, "a", () => 0);
    expect(result).not.toBe("a");
    expect(["b", "c"]).toContain(result);
  });
});
