export function el(etiket, ozellikler = {}, cocuklar = []) {
  const oge = document.createElement(etiket);
  for (const [anahtar, deger] of Object.entries(ozellikler)) {
    if (anahtar === "class" || anahtar === "className") oge.className = deger;
    else if (anahtar === "text") oge.textContent = deger;
    else if (anahtar.startsWith("data-") || anahtar.startsWith("aria-") || ["href", "src", "alt", "for", "role", "target", "rel", "download"].includes(anahtar)) oge.setAttribute(anahtar, deger);
    else oge[anahtar] = deger;
  }
  if (!Array.isArray(cocuklar)) cocuklar = [cocuklar];
  for (const cocuk of cocuklar) {
    if (typeof cocuk === "string") oge.appendChild(document.createTextNode(cocuk));
    else if (cocuk instanceof Node) oge.appendChild(cocuk);
  }
  return oge;
}

export function guvenliMetinAyristir(hamMetin) {
  const kapsayici = document.createDocumentFragment();
  if (!hamMetin) return kapsayici;

  const paragraflar = hamMetin.split(/\n\s*\n/);
  for (const paragraf of paragraflar) {
    const p = el("p");
    const parcalar = paragraf.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    for (const parca of parcalar) {
      if (parca.startsWith("**") && parca.endsWith("**")) {
        p.appendChild(el("strong", { text: parca.slice(2, -2) }));
      } else if (parca.startsWith("[") && parca.includes("](") && parca.endsWith(")")) {
        const metin = parca.slice(1, parca.indexOf("]("));
        const url = parca.slice(parca.indexOf("](") + 2, -1);
        let parsed;
        try { parsed = new URL(url, window.location.href); } catch { parsed = null; }
        if (!parsed || !["http:", "https:"].includes(parsed.protocol)) {
          p.appendChild(document.createTextNode(metin));
          continue;
        }
        p.appendChild(el("a", {
          href: parsed.href,
          text: metin,
          target: "_blank",
          rel: "noopener noreferrer"
        }));
      } else if (parca.length > 0) {
        p.appendChild(document.createTextNode(parca));
      }
    }
    kapsayici.appendChild(p);
  }
  return kapsayici;
}

export function toastGoster(mesaj, tur = "bilgi") {
  let toastAlani = document.getElementById("toast-kapsayici");
  if (!toastAlani) {
    toastAlani = el("div", { id: "toast-kapsayici", class: "toast-alani", role: "status", "aria-live": "polite", "aria-atomic": "true" });
    document.body.appendChild(toastAlani);
  }
  const t = el("div", { class: `toast toast-${tur}`, role: tur === "hata" ? "alert" : "status", text: mesaj });
  toastAlani.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
