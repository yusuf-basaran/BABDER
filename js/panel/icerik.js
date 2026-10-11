import { db } from "../api.js";
import { el, toastGoster } from "../utils.js";

export async function haberModulunuYukle(kapsayici) {
  kapsayici.innerHTML = "";

  const ustBar = el("div", { style: "display: flex; justify-content: space-between; margin-bottom: 1rem;" }, [
    el("button", { class: "btn btn-ana", text: "+ Yeni Haber Ekle", id: "yeni-haber-btn" })
  ]);
  kapsayici.appendChild(ustBar);

  const tabloKapsayici = el("div", { class: "veri-tablosu-kapsayici" });
  const tablo = el("table", { class: "veri-tablosu" }, [
    el("thead", {}, [
      el("tr", {}, [
        el("th", { text: "Başlık" }),
        el("th", { text: "Kategori" }),
        el("th", { text: "Yayın Tarihi" }),
        el("th", { text: "Durum" }),
        el("th", { text: "İşlemler" })
      ])
    ]),
    el("tbody", { id: "haber-tablo-govde" })
  ]);
  tabloKapsayici.appendChild(tablo);
  kapsayici.appendChild(tabloKapsayici);

  const veriler = await db.select("haberler", "order=created_at.desc");
  const govde = document.getElementById("haber-tablo-govde");

  if (!veriler || veriler.length === 0) {
    govde.appendChild(el("tr", {}, [el("td", { colSpan: 5, text: "Kayıtlı haber bulunamadı." })]));
    return;
  }

  veriler.forEach(h => {
    const satir = el("tr", {}, [
      el("td", { text: h.baslik }),
      el("td", { text: h.kategori }),
      el("td", { text: new Date(h.yayin_tarihi).toLocaleDateString("tr-TR") }),
      el("td", {}, [
        el("span", { class: `durum-rozet durum-${h.durum}`, text: h.durum })
      ]),
      el("td", {}, [
        el("button", {
          class: "btn btn-ikincil",
          text: "Sil",
          onclick: async () => {
            if (confirm("Bu haberi silmek istediğinize emin misiniz?")) {
              await db.delete("haberler", h.id);
              toastGoster("Haber başarıyla silindi", "basari");
              haberModulunuYukle(kapsayici);
            }
          }
        })
      ])
    ]);
    govde.appendChild(satir);
  });
}
