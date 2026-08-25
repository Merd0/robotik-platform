import { describe, expect, it } from "vitest";
import { extractPlainText } from "./lessonPlainText";

describe("extractPlainText", () => {
  it("tek satırlık kendini kapatan bir JSX bileşenini tamamen atlar", () => {
    const body = [
      "## Kanca",
      "",
      "Bir soru.",
      "",
      "<JointSliders robot=\"generic-2dof\" />",
      "",
      "## Ne oldu",
      "",
      "Az önce oynadığın şeyin açıklaması.",
    ].join("\n");
    const text = extractPlainText(body);
    expect(text).not.toContain("JointSliders");
    expect(text).not.toContain("generic-2dof");
    expect(text).toContain("Bir soru.");
    expect(text).toContain("Az önce oynadığın şeyin açıklaması.");
  });

  it("çok satırlı, kendi kendini kapatan bir JSX bloğunu (ör. Quiz) tamamen atlar", () => {
    const body = [
      "## Dene",
      "",
      "<Quiz",
      "  sorular={[",
      "    { soru: \"Bir soru?\", secenekler: [\"a\", \"b\"], dogru: 0 },",
      "  ]}",
      "/>",
      "",
      "## Sonraki",
      "",
      "İlgili dersler burada.",
    ].join("\n");
    const text = extractPlainText(body);
    expect(text).not.toContain("sorular");
    expect(text).not.toContain("secenekler");
    expect(text).toContain("İlgili dersler burada.");
  });

  it("açık/kapalı etiketli bir JSX bloğunu (<Neden>...</Neden>) atlar", () => {
    const body = [
      "Normal metin.",
      "",
      "<Neden etiket=\"Neden?\">",
      "  İçerideki teknik detay.",
      "</Neden>",
      "",
      "Devam eden metin.",
    ].join("\n");
    const text = extractPlainText(body);
    expect(text).not.toContain("İçerideki teknik detay");
    expect(text).toContain("Normal metin.");
    expect(text).toContain("Devam eden metin.");
  });

  it("kod bloklarını (```) atlar", () => {
    const body = [
      "Açıklama metni.",
      "",
      "```python",
      "robot.movej([10, 20])",
      "```",
      "",
      "Devam metni.",
    ].join("\n");
    const text = extractPlainText(body);
    expect(text).not.toContain("robot.movej");
    expect(text).toContain("Açıklama metni.");
    expect(text).toContain("Devam metni.");
  });

  it("başlık işaretlerini (##) ve satır içi vurgu işaretlerini (** _ `) temizler", () => {
    const body = "## Bir Başlık\n\nBu **kalın** ve _italik_ ve `kod` içeren bir cümle.";
    const text = extractPlainText(body);
    expect(text).toContain("Bir Başlık");
    expect(text).toContain("Bu kalın ve italik ve kod içeren bir cümle.");
    expect(text).not.toContain("#");
    expect(text).not.toContain("**");
    expect(text).not.toContain("`");
  });

  it("markdown bağlantılarını yalnız görünen metne indirger", () => {
    const body = "Kaynak için [Modern Robotics](https://example.com) kitabına bak.";
    const text = extractPlainText(body);
    expect(text).toContain("Modern Robotics");
    expect(text).not.toContain("https://example.com");
    expect(text).not.toContain("[");
  });

  it("boş girdi için boş metin döner", () => {
    expect(extractPlainText("")).toBe("");
  });
});
