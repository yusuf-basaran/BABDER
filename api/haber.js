import { readFile } from "node:fs/promises";
import path from "node:path";
import { CONFIG, SITE_URL } from "../js/config.js";

const root = process.cwd();

function htmlEscape(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function metaEkle(html, property, content) {
  const tag = `<meta property="${property}" content="${htmlEscape(content)}">`;
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta\\s+property=["']${escaped}["'][^>]*>`, "i");
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

function safeImage(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : `${SITE_URL}/img/og-image.png`;
  } catch {
    return `${SITE_URL.replace(/\/$/, "")}/img/og-image.png`;
  }
}

function haberGovdesi(haber) {
  const baslik = htmlEscape(haber.baslik);
  const ozet = haber.ozet ? `<p class="haber-ozet">${htmlEscape(haber.ozet)}</p>` : "";
  const metin = String(haber.icerik || "").split(/\r?\n\s*\r?\n/).map(paragraf => `<p>${htmlEscape(paragraf).replaceAll("\n", "<br>")}</p>`).join("");
  const tarih = haber.yayin_tarihi ? new Date(haber.yayin_tarihi).toLocaleDateString("tr-TR") : "";
  const image = safeImage(haber.kapak_gorseli);
  const kapak = haber.kapak_gorseli ? `<img src="${htmlEscape(image)}" alt="${baslik}" class="kart-gorsel" width="1200" height="675" fetchpriority="high">` : "";
  return `<article id="haber-icerik-alani" class="haber-detay"><h1>${baslik}</h1><p class="soluk-metin">${htmlEscape([tarih, haber.kategori].filter(Boolean).join(" · "))}</p>${kapak}${ozet}<div class="haber-govde-metin">${metin}</div></article>`;
}

async function sayfaSablonuOku() {
  return readFile(path.join(root, "dist", "sayfalar", "haber-detay.html"), "utf8");
}

export default async function handler(req, res) {
  const slug = String(req.query?.slug || "");
  if (!/^[a-z0-9-]{1,250}$/.test(slug)) {
    res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.send(await readFile(path.join(root, "dist", "404.html"), "utf8"));
  }

  try {
    const endpoint = `${CONFIG.SUPABASE_URL}/rest/v1/haberler?select=baslik,ozet,icerik,kapak_gorseli,kategori,yayin_tarihi,slug&slug=eq.${encodeURIComponent(slug)}&durum=eq.yayinda&deleted_at=is.null&limit=1`;
    const response = await fetch(endpoint, { headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}` } });
    if (!response.ok) throw new Error(`Supabase ${response.status}`);
    const [haber] = await response.json();
    if (!haber || (haber.yayin_tarihi && new Date(haber.yayin_tarihi).getTime() > Date.now())) {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      return res.send(await readFile(path.join(root, "dist", "404.html"), "utf8"));
    }

    const pageUrl = `${SITE_URL.replace(/\/$/, "")}/haber/${slug}`;
    const image = safeImage(haber.kapak_gorseli);
    let html = await sayfaSablonuOku();
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(haber.baslik)} | BABDER</title>`);
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${htmlEscape(haber.ozet || haber.baslik)}">`);
    html = metaEkle(html, "og:type", "article");
    html = metaEkle(html, "og:title", `${haber.baslik} | BABDER`);
    html = metaEkle(html, "og:description", haber.ozet || haber.baslik);
    html = metaEkle(html, "og:url", pageUrl);
    html = metaEkle(html, "og:image", image);
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${htmlEscape(pageUrl)}">`);
    html = html.replace(/<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${htmlEscape(image)}">`);
    html = html.replace(/<article id="haber-icerik-alani">[\s\S]*?<\/article>/i, haberGovdesi(haber));
    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    return res.send(html);
  } catch (error) {
    console.error("Haber sayfası oluşturulamadı:", error.message);
    res.status(503).setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.send("<!doctype html><html lang=\"tr\"><meta charset=\"utf-8\"><title>Geçici sorun | BABDER</title><h1>Haber şu anda yüklenemiyor</h1><p>Lütfen kısa süre sonra yeniden deneyin.</p></html>");
  }
}
