import { db } from "../api.js";
import { el, toastGoster } from "../utils.js";

const DURUMLAR = ["taslak", "incelemede", "yayinda", "arsiv"];

export async function haberModulunuYukle(kapsayici) {
  kapsayici.replaceChildren();
  const canEdit = ["admin", "editor"].includes(window.BABDER_ROLE);
  const ustBar = el("div", { style: "display:flex;justify-content:space-between;margin-bottom:1rem;" }, [
    ...(canEdit ? [el("button", { class: "btn btn-ana", text: "+ Yeni Haber Ekle", onclick: () => haberFormuAc(kapsayici) })] : [])
  ]);
  kapsayici.appendChild(ustBar);
  const tabloKapsayici = el("div", { class: "veri-tablosu-kapsayici" });
  const govde = el("tbody");
  const tablo = el("table", { class: "veri-tablosu" }, [
    el("thead", {}, [el("tr", {}, ["Başlık", "Kategori", "Yayın Tarihi", "Durum", "İşlemler"].map(text => el("th", { text })))]),
    govde
  ]);
  tabloKapsayici.appendChild(tablo);
  kapsayici.appendChild(tabloKapsayici);

  let veriler;
  try {
    veriler = await db.select("haberler", "deleted_at=is.null&order=created_at.desc");
  } catch {
    govde.appendChild(el("tr", {}, [el("td", { colSpan: 5, text: "Haberler yüklenemedi. Yetkinizi ve bağlantınızı kontrol edip yeniden deneyin." })]));
    return;
  }
  if (!veriler?.length) {
    govde.appendChild(el("tr", {}, [el("td", { colSpan: 5, text: "Kayıtlı haber bulunamadı." })]));
    return;
  }
  for (const h of veriler) {
    const satir = el("tr", {}, [
      el("td", { text: h.baslik }),
      el("td", { text: h.kategori }),
      el("td", { text: new Date(h.yayin_tarihi).toLocaleDateString("tr-TR") }),
      el("td", { text: h.durum }),
      el("td", {}, canEdit ? [
        el("button", { class: "btn btn-ikincil", text: "Düzenle", onclick: () => haberFormuAc(kapsayici, h) }),
        el("button", { class: "btn btn-ikincil", text: "Çöpe Taşı", onclick: async () => {
          if (!confirm("Bu haberi çöp kutusuna taşımak istiyor musunuz?")) return;
          try {
            await db.update("haberler", h.id, { deleted_at: new Date().toISOString() });
            toastGoster("Haber çöp kutusuna taşındı.", "basari");
            await haberModulunuYukle(kapsayici);
          } catch {
            toastGoster("Haber silinemedi. Yetkinizi ve bağlantınızı kontrol edin.", "hata");
          }
        } })
      ] : [el("span", { text: "Görüntüleme" })])
    ]);
    govde.appendChild(satir);
  }
}

function haberFormuAc(kapsayici, haber = null) {
  const alan = (etiket, ad, deger = "", tur = "input") => {
    const kontrol = tur === "textarea"
      ? el("textarea", { name: ad, class: "form-denetim", required: true, rows: 5, text: deger })
      : el("input", { name: ad, class: "form-denetim", value: deger, required: true, ...(ad === "ozet" ? { maxLength: 500 } : {}) });
    return el("label", { style: "display:grid;gap:.35rem;margin:.75rem 0;", text: etiket }, [kontrol]);
  };
  const form = el("form", { class: "kart", style: "max-width:700px;margin:1rem 0;" }, [
    el("h3", { text: haber ? "Haberi Düzenle" : "Yeni Haber" }),
    alan("Başlık", "baslik", haber?.baslik || ""),
    alan("Özet (en fazla 500 karakter)", "ozet", haber?.ozet || ""),
    alan("İçerik", "icerik", haber?.icerik || "", "textarea"),
    alan("Kategori", "kategori", haber?.kategori || "Genel"),
    alan("Slug", "slug", haber?.slug || ""),
    el("label", { style: "display:grid;gap:.35rem;margin:.75rem 0;", text: "Durum" }, [
      el("select", { name: "durum", class: "form-denetim" }, DURUMLAR.map(d => el("option", { value: d, text: d, selected: (haber?.durum || "taslak") === d })))
    ]),
    el("div", { style: "display:flex;gap:.5rem;" }, [
      el("button", { class: "btn btn-ana", type: "submit", text: "Kaydet" }),
      el("button", { class: "btn btn-ikincil", type: "button", text: "Vazgeç", onclick: () => form.remove() })
    ])
  ]);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.slug = data.slug.trim().toLocaleLowerCase("tr-TR").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!data.slug) {
      toastGoster("Geçerli bir URL kısa adı girin.", "hata");
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      if (haber) await db.update("haberler", haber.id, data);
      else await db.insert("haberler", data);
      toastGoster(haber ? "Haber güncellendi." : "Haber oluşturuldu.", "basari");
      await haberModulunuYukle(kapsayici);
    } catch {
      toastGoster("Kaydetme başarısız. Slug benzersiz mi ve yayın yetkiniz var mı kontrol edin.", "hata");
      submit.disabled = false;
    }
  });
  kapsayici.prepend(form);
}
