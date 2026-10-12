import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CONFIG, SITE_URL } from "../js/config.js";

const YAYIN_SAYFALARI = [
  ["/", "weekly", "1.0"],
  ["/sayfalar/hakkimizda", "monthly", "0.8"],
  ["/sayfalar/tuzuk-ve-belgeler", "monthly", "0.7"],
  ["/sayfalar/yonetim-kurulu", "monthly", "0.7"],
  ["/sayfalar/koylerimiz", "monthly", "0.8"],
  ["/sayfalar/haberler", "daily", "0.9"],
  ["/sayfalar/etkinlikler", "weekly", "0.8"],
  ["/sayfalar/galeri", "weekly", "0.7"],
  ["/sayfalar/uyelik-basvurusu", "monthly", "0.8"],
  ["/sayfalar/bagis", "monthly", "0.7"],
  ["/sayfalar/iletisim", "monthly", "0.8"],
  ["/sayfalar/taziyeler", "daily", "0.7"],
  ["/sayfalar/sss", "monthly", "0.7"],
  ["/sayfalar/nasil-uye-olurum", "monthly", "0.7"],
  ["/sayfalar/kvkk", "yearly", "0.5"],
  ["/sayfalar/gizlilik-politikasi", "yearly", "0.5"],
  ["/sayfalar/cerez-politikasi", "yearly", "0.5"]
];

function xmlMetni(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export async function sitemapUret(hedefDizin = process.argv[2] || "dist") {
  const base = SITE_URL.replace(/\/$/, "");
  const urls = YAYIN_SAYFALARI.map(([pathName, changefreq, priority]) =>
    `  <url><loc>${xmlMetni(`${base}${pathName}`)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
  );
  try {
    const endpoint = `${CONFIG.SUPABASE_URL}/rest/v1/haberler?select=slug,yayin_tarihi&durum=eq.yayinda&deleted_at=is.null&order=yayin_tarihi.desc`;
    const response = await fetch(endpoint, { headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}` } });
    if (!response.ok) throw new Error(`Supabase ${response.status}`);
    const news = await response.json();
    for (const item of news) {
      if (!/^[a-z0-9-]+$/.test(item.slug || "")) continue;
      const lastmod = item.yayin_tarihi ? `<lastmod>${xmlMetni(new Date(item.yayin_tarihi).toISOString())}</lastmod>` : "";
      urls.push(`  <url><loc>${xmlMetni(`${base}/haber/${item.slug}`)}</loc>${lastmod}<changefreq>yearly</changefreq><priority>0.7</priority></url>`);
    }
  } catch (error) {
    console.warn("Sitemap oluşturulurken yayınlanmış haberler alınamadı; sayfa URL'leri yazılıyor:", error.message);
  }
  await mkdir(hedefDizin, { recursive: true });
  await writeFile(path.join(hedefDizin, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`, "utf8");
  await writeFile(path.join(hedefDizin, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /yonetim/\nSitemap: ${base}/sitemap.xml\n`, "utf8");
}
