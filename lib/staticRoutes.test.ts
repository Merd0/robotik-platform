import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  NOINDEX_STATIC_ROUTES,
  discoverStaticPageRoutes,
  getIndexableStaticPageRoutes,
} from "./staticRoutes";

const APP_DIR = path.join(process.cwd(), "app");

describe("statik App Router rota keşfi", () => {
  it("yeni statik sayfaları elle sitemap listesine eklemeden bulur", () => {
    const routes = discoverStaticPageRoutes(APP_DIR);

    expect(routes).toContain("/");
    expect(routes).toContain("/laboratuvar/dil-karsilastirici");
    expect(routes).toContain("/ogretmen/hat-c");
    expect(routes).toContain("/zaman-kapsulu");
    expect(routes.some((route) => route.includes("["))).toBe(false);
  });

  it("yalnız açıkça noindex olan araçları sitemap dışında bırakır", () => {
    const indexable = getIndexableStaticPageRoutes(APP_DIR);

    expect(NOINDEX_STATIC_ROUTES).toEqual(["/ara", "/kanit-okuyucu"]);
    expect(indexable).not.toContain("/ara");
    expect(indexable).not.toContain("/kanit-okuyucu");
    expect(indexable).toContain("/ogretmen/kod-akademisi");
    expect(indexable).toContain("/kirik-kod-laboratuvari");
  });
});
