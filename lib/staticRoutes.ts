import fs from "node:fs";
import path from "node:path";

/** Kullanıcıya yararlı ama arama sonucu olarak zayıf/kişisel durum araçları. */
export const NOINDEX_STATIC_ROUTES = ["/ara", "/kanit-okuyucu"] as const;

export interface StaticPageRoute {
  route: string;
  filePath: string;
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

/**
 * Dinamik segmentleri veri katalogları ayrı üretir. Burada yalnız gerçek
 * `app` altındaki `page.tsx` statik rotaları bulunur; böylece yeni bir laboratuvarın
 * sitemap'e elle eklenip unutulması mümkün olmaz.
 */
export function discoverStaticPages(appDirectory = path.join(process.cwd(), "app")): StaticPageRoute[] {
  return walk(appDirectory)
    .filter((filePath) => path.basename(filePath) === "page.tsx")
    .map((filePath) => ({
      filePath,
      segments: path.relative(appDirectory, path.dirname(filePath)).split(path.sep),
    }))
    .filter(({ segments }) => segments.every((segment) => !segment.includes("[")))
    .map(({ filePath, segments }) => ({ filePath, segments: segments.filter((segment) => {
      const isRouteGroup = segment.startsWith("(") && segment.endsWith(")");
      return !isRouteGroup;
    }) }))
    .map(({ filePath, segments }) => ({
      filePath,
      route: segments.length === 0 || segments[0] === "" ? "/" : `/${segments.join("/")}`,
    }))
    .sort((a, b) => a.route.localeCompare(b.route, "tr"));
}

export function discoverStaticPageRoutes(appDirectory?: string): string[] {
  return discoverStaticPages(appDirectory).map((page) => page.route);
}

export function getIndexableStaticPageRoutes(appDirectory?: string): string[] {
  const noindex = new Set<string>(NOINDEX_STATIC_ROUTES);
  return discoverStaticPageRoutes(appDirectory).filter((route) => !noindex.has(route));
}

export function getIndexableStaticPages(appDirectory?: string): StaticPageRoute[] {
  const noindex = new Set<string>(NOINDEX_STATIC_ROUTES);
  return discoverStaticPages(appDirectory).filter((page) => !noindex.has(page.route));
}
