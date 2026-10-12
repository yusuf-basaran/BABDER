import { db } from "../js/api.js";
import { el, guvenliMetinAyristir } from "../js/utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const routeSlug = window.location.pathname.match(/^\/haber\/([a-z0-9-]+)\/?$/)?.[1];
  const slug = urlParams.get("slug") || routeSlug;
  const kapsayici = document.getElementById("haber-icerik-alani");

  if (!slug) {
    kapsayici.replaceChildren();
    kapsayici.appendChild(el("p", { text: "Geçerli bir haber seçilmedi." }));
    return;
  }

  let sonuclar;
  try { sonuclar = await db.select("haberler", `slug=eq.${encodeURIComponent(slug)}&durum=eq.yayinda&deleted_at=is.null`); }
  catch {
    kapsayici.replaceChildren(el("h1", { text: "Haber yüklenemedi" }), el("p", { text: "Bağlantı sorunu oluştu. Lütfen daha sonra yeniden deneyin." }));
    return;
  }

  kapsayici.replaceChildren();

  if (!sonuclar || sonuclar.length === 0) {
    kapsayici.appendChild(el("h1", { text: "Haber Bulunamadı" }));
    kapsayici.appendChild(el("p", { text: "Talep ettiğiniz haber yayından kaldırılmış veya taşınmış olabilir." }));
    return;
  }

  const haber = sonuclar[0];
  document.title = `${haber.baslik} | BABDER`;

  const baslik = el("h1", { text: haber.baslik, style: "color: var(--renk-ana-koyu); margin-bottom: 0.5rem;" });
  const meta = el("div", { 
    text: `${new Date(haber.yayin_tarihi).toLocaleDateString("tr-TR")} | Kategori: ${haber.kategori}`,
    style: "color: var(--renk-metin-soluk); font-size: 0.9rem; margin-bottom: 1.5rem;"
  });

  kapsayici.append(baslik, meta);

  if (haber.kapak_gorseli) {
    const resim = el("img", {
      src: haber.kapak_gorseli,
      alt: haber.baslik,
      class: "kart-gorsel",
      style: "height: auto; max-height: 450px; width: 100%; object-fit: cover; margin-bottom: 1.5rem;"
    });
    kapsayici.appendChild(resim);
  }

  if (haber.ozet) {
    const ozetP = el("p", { 
      text: haber.ozet, 
      style: "font-weight: 600; font-size: 1.1rem; line-height: 1.5; margin-bottom: 1.5rem; color: var(--renk-metin);" 
    });
    kapsayici.appendChild(ozetP);
  }

  const govdeKapsayici = el("div", { class: "haber-govde-metin", style: "line-height: 1.8;" });
  govdeKapsayici.appendChild(guvenliMetinAyristir(haber.icerik));
  kapsayici.appendChild(govdeKapsayici);
  const shareUrl = `${window.location.origin}/haber/${encodeURIComponent(haber.slug)}`;
  kapsayici.appendChild(el("p", {}, [
    el("a", { href: `https://wa.me/?text=${encodeURIComponent(`${haber.baslik} ${shareUrl}`)}`, text: "WhatsApp'ta paylaş", target: "_blank", rel: "noopener noreferrer" }),
    " · ",
    el("a", { href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, text: "Facebook'ta paylaş", target: "_blank", rel: "noopener noreferrer" })
  ]));
});
