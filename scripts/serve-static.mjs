import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const root = path.resolve(readArg("--root", "out"));
const port = Number(readArg("--port", "3102"));
if (!existsSync(root) || !statSync(root).isDirectory()) {
  throw new Error(`Statik kök bulunamadı: ${root}`);
}
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Geçersiz port.");

const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function resolveRequest(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const relative = pathname.replace(/^\/+/, "");
  const candidates = relative === ""
    ? ["index.html"]
    : [relative, `${relative}.html`, path.join(relative, "index.html")];
  for (const candidate of candidates) {
    const resolved = path.resolve(root, candidate);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) continue;
    if (existsSync(resolved) && statSync(resolved).isFile()) return resolved;
  }
  return null;
}

const server = createServer((request, response) => {
  const file = resolveRequest(request.url ?? "/");
  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Bulunamadı");
    return;
  }
  response.writeHead(200, {
    "content-type": mime[path.extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Statik test sunucusu: http://127.0.0.1:${port} (${root})`);
});
