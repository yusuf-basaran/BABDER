import { el } from "./utils.js";

// Yalnızca bekleyen içerik alanını değiştirir; menü ve form kontrolleri kullanılabilir kalır.
export async function iskeletleYukle(hedefler, yukle, tur = "kart", adet = 3) {
  const roots = typeof hedefler === "string" ? [...document.querySelectorAll(hedefler)] : [hedefler].flat().filter(Boolean);
  const bekleyenler = roots.map(root => {
    const original = [...root.childNodes];
    // Sunucunun hazır gönderdiği haber gövdesini yeniden gizleme.
    const hazirHaber = Boolean(root.querySelector(".haber-govde-metin"));
    const placeholders = hazirHaber ? [] : Array.from({ length: adet }, () => iskeletOlustur(tur));
    root.setAttribute("aria-busy", "true");
    if (!hazirHaber) root.replaceChildren(...placeholders);
    return { root, original, placeholders };
  });
  try {
    return await yukle();
  } catch (error) {
    for (const { root, placeholders } of bekleyenler) {
      if (placeholders.some(node => node.parentNode === root)) root.replaceChildren(el("p", { role: "status", text: "İçerik şu anda yüklenemiyor. Lütfen daha sonra yeniden deneyin." }));
    }
    console.warn("İçerik yüklenemedi:", error);
  } finally {
    for (const { root, original, placeholders } of bekleyenler) {
      if (placeholders.some(node => node.parentNode === root)) {
        root.replaceChildren(...(original.length ? original : [el("p", { role: "status", text: "Henüz yayımlanmış içerik bulunmuyor." })]));
      }
      root.setAttribute("aria-busy", "false");
    }
  }
}

function iskeletOlustur(tur) {
  const visual = el("div", { class: `iskelet-govde iskelet-${tur}`, "aria-hidden": "true" });
  if (["kart", "haber"].includes(tur)) visual.appendChild(el("div", { class: "iskelet-parca iskelet-gorsel" }));
  visual.append(el("div", { class: "iskelet-parca iskelet-baslik" }), el("div", { class: "iskelet-parca iskelet-satir" }), el("div", { class: "iskelet-parca iskelet-satir" }), el("div", { class: "iskelet-parca iskelet-kisa" }));
  return el("div", { class: "iskelet-kart" }, [el("span", { class: "iskelet-erisebilir", text: "İçerik yükleniyor…" }), visual]);
}
