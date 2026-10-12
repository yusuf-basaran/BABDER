import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const errors = [];
async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await walk(file); continue; }
    if (!/\.(html|js|mjs)$/.test(entry.name)) continue;
    const source = await readFile(file, "utf8");
    const refs = entry.name.endsWith(".html") ? [...source.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(match => match[1]) : [...source.matchAll(/\bfrom\s+["'](\.[^"']+)["']/g)].map(match => match[1]);
    for (const ref of refs) {
      if (/^(?:https?:|mailto:|tel:|data:|blob:|#)/i.test(ref)) continue;
      const clean = ref.split(/[?#]/)[0];
      if (!clean || /^\/haber\/[a-z0-9-]+$/.test(clean)) continue;
      let target = clean.startsWith("/") ? path.join(root, clean.slice(1)) : path.resolve(path.dirname(file), clean);
      if (clean.endsWith("/")) target = path.join(target, "index.html");
      if (!(await exists(target)) && !(await exists(`${target}.html`))) errors.push(`${path.relative(root, file)} → ${ref}`);
    }
    if (source.includes("<!-- PARTIAL:")) errors.push(`${path.relative(root, file)} → çözümlenmemiş şablon`);
  }
}
await walk(root);
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log("Yerel bağlantılar ve modül hedefleri geçerli.");
