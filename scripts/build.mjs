import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "../js/config.js";
import { sitemapUret } from "./sitemap.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const excluded = new Set([".git", ".github", ".vercel", "api", "dist", "node_modules", "partials", "scripts", "supabase", "README.md", "package.json", "package-lock.json"]);
const base = SITE_URL.replace(/\/$/, "");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  await cp(path.join(root, entry.name), path.join(output, entry.name), { recursive: true });
}
await rm(path.join(output, "img", "logo.png"), { force: true });
await rm(path.join(output, "img", "kaynak"), { recursive: true, force: true });

const partials = Object.fromEntries(await Promise.all(["header", "footer", "cookie"].map(async name => [name, await readFile(path.join(root, "partials", `${name}.html`), "utf8")])));
async function expandHtml(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await expandHtml(file); continue; }
    if (!entry.name.endsWith(".html")) continue;
    let html = await readFile(file, "utf8");
    for (const [name, partial] of Object.entries(partials)) html = html.replaceAll(`<!-- PARTIAL:${name} -->`, partial.trim());
    html = html.replace(/(<img\b[^>]*\bsrc=["'])(?:\.\.\/|\.\/|\/)?img\/logo\.png(["'][^>]*>)/g, "$1/img/logo-192.webp$2");
    html = html.replace(/<link\b[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>/gi, "");
    html = html.replace("</head>", `  <link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png">\n  <link rel="icon" type="image/png" sizes="192x192" href="/img/favicon-192.png">\n  <link rel="apple-touch-icon" sizes="180x180" href="/img/apple-touch-icon.png">\n</head>`);
    html = html.replace(/<img(?![^>]*\bwidth=)([^>]*\bsrc=["']\/img\/logo-192\.webp["'][^>]*)>/gi, '<img width="192" height="192"$1>');
    const relative = path.relative(output, file).replaceAll(path.sep, "/");
    if (!relative.startsWith("yonetim/")) html = seoEtiketleriniUygula(html, relative);
    await writeFile(file, html, "utf8");
  }
}

function upsertMeta(html, property, content) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = `<meta property="${property}" content="${htmlEscape(content)}">`;
  const pattern = new RegExp(`<meta\\s+property=["']${escaped}["'][^>]*>`, "i");
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

function htmlEscape(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function seoEtiketleriniUygula(html, relative) {
  const route = relative === "index.html" ? "/" : `/${relative.replace(/\.html$/i, "")}`;
  const canonical = `${base}${route}`;
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "BABDER";
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i)?.[1] || title;
  const canonicalTag = `<link rel="canonical" href="${htmlEscape(canonical)}">`;
  const canonicalPattern = /<link\s+rel=["']canonical["'][^>]*>/i;
  html = canonicalPattern.test(html) ? html.replace(canonicalPattern, canonicalTag) : html.replace("</head>", `  ${canonicalTag}\n</head>`);
  html = upsertMeta(html, "og:title", title);
  html = upsertMeta(html, "og:description", description);
  html = upsertMeta(html, "og:url", canonical);
  html = upsertMeta(html, "og:image", `${base}/img/og-image.png`);
  html = upsertMeta(html, "og:type", "website");
  const twitterImage = `<meta name="twitter:image" content="${htmlEscape(`${base}/img/og-image.png`)}">`;
  const twitterPattern = /<meta\s+name=["']twitter:image["'][^>]*>/i;
  html = twitterPattern.test(html) ? html.replace(twitterPattern, twitterImage) : html.replace("</head>", `  ${twitterImage}\n</head>`);
  return html;
}

await expandHtml(output);
await sitemapUret(output);
console.log(`BABDER sitesi ${path.relative(root, output)} dizinine hazırlandı.`);
