import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccessiblePre } from "@/components/lesson/AccessiblePre";

describe("AccessiblePre", () => {
  it("kod bloğunu klavye odağı ve adlandırılmış bölge olarak sunar", () => {
    const html = renderToStaticMarkup(
      createElement(AccessiblePre, null, createElement("code", null, "T = [ R p ]")),
    );

    expect(html).toContain('tabindex="0"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Kod veya formül bloğu"');
    expect(html).toContain("T = [ R p ]");
  });

  it("bağlama özel erişilebilir adı korur", () => {
    const html = renderToStaticMarkup(
      createElement(AccessiblePre, { "aria-label": "Homojen dönüşüm matrisi" }),
    );

    expect(html).toContain('aria-label="Homojen dönüşüm matrisi"');
  });
});
