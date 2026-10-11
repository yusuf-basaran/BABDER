import { db } from "../api.js";
import { el, toastGoster } from "../utils.js";

export async function basvuruModulunuYukle(kapsayici) {
  kapsayici.innerHTML = "";

  const aksiyonlar = el("div", { style: "display: flex; gap: 1rem; margin-bottom: 1rem;" }, [
    el("button", { class: "btn btn-ikincil", text: "CSV Olarak İndir", id: "csv-indir-btn" })
  ]);
  kapsayici.appendChild(aksiyonlar);

  const tabloKapsayici = el("div", { class: "veri-tablosu-kapsayici" });
  const tablo = el("table", { class: "veri-tablosu" }, [
    el("thead", {}, [
      el("tr", {}, [
        el("th", { text: "Başvuran" }),
        el("th", { text: "Telefon" }),
        el("th", { text: "E-Posta" }),
        el("th", { text: "Köy Bağı" }),
        el("th", { text: "Tarih" }),
        el("th", { text: "Durum" }),
        el("th", { text: "İşlem" })
      ])
    ]),
    el("tbody", { id: "basvuru-tablo-govde" })
  ]);
  tabloKapsayici.appendChild(tablo);
  kapsayici.appendChild(tabloKapsayici);

  const veriler = await db.select("uyelik_basvurulari", "order=created_at.desc");
  const govde = document.getElementById("basvuru-tablo-govde");

  if (!veriler || veriler.length === 0) {
    govde.appendChild(el("tr", {}, [el("td", { colSpan: 7, text: "Bekleyen başvuru yok." })]));
    return;
  }

  veriler.forEach(b => {
    const satir = el("tr", {}, [
      el("td", { text: b.ad_soyad }),
      el("td", { text: b.telefon }),
      el("td", { text: b.eposta }),
      el("td", { text: b.koy_bagi }),
      el("td", { text: new Date(b.created_at).toLocaleDateString("tr-TR") }),
      el("td", { text: b.durum }),
      el("td", {}, [
        el("button", {
          class: "btn btn-ana",
          text: "Onayla",
          onclick: async () => {
            await db.update("uyelik_basvurulari", b.id, { durum: "onaylandi" });
            toastGoster("Başvuru onaylandı", "basari");
            basvuruModulunuYukle(kapsayici);
          }
        })
      ])
    ]);
    govde.appendChild(satir);
  });

  document.getElementById("csv-indir-btn")?.addEventListener("click", () => {
    let csv = "Ad Soyad,Telefon,Eposta,Koy Bagi,Tarih\n";
    veriler.forEach(v => {
      csv += `"${v.ad_soyad}","${v.telefon}","${v.eposta}","${v.koy_bagi}","${v.created_at}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = el("a", { href: URL.createObjectURL(blob), download: "uyelik_basvurulari.csv" });
    link.click();
  });
}
