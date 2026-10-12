import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain" };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
    try { if ((await stat(file)).isDirectory()) file = path.join(file, "index.html"); }
    catch { if (!path.extname(file)) file += ".html"; }
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" }); res.end(data);
  } catch { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Sayfa bulunamadı."); }
}).listen(Number(process.env.PORT || 4173), "127.0.0.1", () => console.log("BABDER preview http://127.0.0.1:4173"));
