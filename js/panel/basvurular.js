import { db } from "../api.js";
import { el, toastGoster } from "../utils.js";

const DURUMLAR = ["yeni", "inceleniyor", "onaylandi", "reddedildi"];

export async function basvuruModulunuYukle(kapsayici) {
  kapsayici.replaceChildren();
  const aksiyonlar = el("div", { style: "display:flex;gap:1rem;margin-bottom:1rem;" }, [
    el("button", { class: "btn btn-ikincil", text: "CSV olarak indir" })
  ]);
  kapsayici.appendChild(aksiyonlar);
  const tbody = el("tbody");
  const table = el("table", { class: "veri-tablosu" }, [
    el("thead", {}, [el("tr", {}, ["Başvuran", "Telefon", "E-posta", "Köy bağı", "Tarih", "Durum", "İşlem"].map(text => el("th", { text })))]), tbody
  ]);
  kapsayici.appendChild(el("div", { class: "veri-tablosu-kapsayici" }, [table]));

  let rows;
  try { rows = await db.select("uyelik_basvurulari", "deleted_at=is.null&order=created_at.desc"); }
  catch { tbody.appendChild(el("tr", {}, [el("td", { colSpan: 7, text: "Başvurular yüklenemedi. Rol izinlerini veya bağlantıyı kontrol edin." })])); return; }
  if (!rows.length) tbody.appendChild(el("tr", {}, [el("td", { colSpan: 7, text: "Başvuru bulunamadı." })]));

  for (const row of rows) {
    const status = el("select", { class: "form-denetim", value: row.durum }, DURUMLAR.map(value => el("option", { value, text: value, selected: value === row.durum })));
    status.addEventListener("change", async () => {
      status.disabled = true;
      try { await db.update("uyelik_basvurulari", row.id, { durum: status.value }); toastGoster("Başvuru durumu güncellendi.", "basari"); }
      catch { status.value = row.durum; toastGoster("Durum güncellenemedi.", "hata"); }
      finally { status.disabled = false; }
    });
    tbody.appendChild(el("tr", {}, [
      el("td", { text: row.ad_soyad }), el("td", { text: row.telefon }), el("td", { text: row.eposta }), el("td", { text: row.koy_bagi }),
      el("td", { text: new Date(row.created_at).toLocaleDateString("tr-TR") }), el("td", {}, [status]),
      el("td", {}, [el("button", { class: "btn btn-ikincil", text: "Mesajı gör", onclick: () => alert(row.mesaj || "Başvuru mesajı bulunmuyor.") })])
    ]));
  }

  aksiyonlar.querySelector("button").addEventListener("click", () => {
    const csvCell = value => {
      const text = String(value ?? "");
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const lines = [["Ad Soyad", "Telefon", "E-posta", "Köy Bağı", "Tarih", "Durum"], ...rows.map(r => [r.ad_soyad, r.telefon, r.eposta, r.koy_bagi, r.created_at, r.durum])];
    const csv = "\uFEFF" + lines.map(line => line.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = el("a", { href: url, download: "uyelik_basvurulari.csv" });
    link.click();
    URL.revokeObjectURL(url);
  });
}
