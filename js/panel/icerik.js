import { db } from "../api.js";
import { el, toastGoster } from "../utils.js";
import { gorselAlaniniOlustur, gorseliYukle } from "./medya.js";
import { alanYardimiEkle } from "./rehber.js";

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

async function haberFormuAc(kapsayici, haber = null) {
  const editorYayinlayabilir = window.BABDER_ROLE === "admin" || await db.select("ayarlar", "anahtar=eq.editor_yayinlayabilir&select=deger&limit=1")
    .then(rows => rows[0]?.deger === "true").catch(() => false);
  const durumlar = editorYayinlayabilir || haber?.durum === "yayinda" ? DURUMLAR : DURUMLAR.filter(durum => durum !== "yayinda");
  const kapakGorseli = gorselAlaniniOlustur(haber?.kapak_gorseli || "");
  const alan = (etiket, ad, deger = "", tur = "input") => {
    const kontrol = tur === "textarea"
      ? el("textarea", { name: ad, class: "form-denetim", required: true, rows: 5, text: deger })
      : el("input", { name: ad, class: "form-denetim", value: deger, required: true, ...(ad === "ozet" ? { maxLength: 500 } : {}) });
    const grup = el("div", { class: "panel-form-alani" }, [el("label", { class: "form-grup", text: etiket }, [kontrol])]);
    alanYardimiEkle(kontrol, grup, "haberler", ad, etiket);
    return grup;
  };
  const form = el("form", { class: "kart", style: "max-width:700px;margin:1rem 0;" }, [
    el("h3", { text: haber ? "Haberi Düzenle" : "Yeni Haber" }),
    alan("Başlık", "baslik", haber?.baslik || ""),
    alan("Özet (en fazla 500 karakter)", "ozet", haber?.ozet || ""),
    alan("İçerik", "icerik", haber?.icerik || "", "textarea"),
    alan("Kategori", "kategori", haber?.kategori || "Genel"),
    alan("URL kısa adı (slug)", "slug", haber?.slug || ""),
    el("label", { style: "display:grid;gap:.35rem;margin:.75rem 0;", text: "Kapak görseli" }, [kapakGorseli.root]),
    el("label", { style: "display:grid;gap:.35rem;margin:.75rem 0;", text: "Durum" }, [
      el("select", { name: "durum", class: "form-denetim" }, durumlar.map(d => el("option", { value: d, text: d, selected: (haber?.durum || "taslak") === d })))
    ]),
    ...(!editorYayinlayabilir && window.BABDER_ROLE === "editor" ? [el("p", { class: "form-yardim", role: "status", text: "Yayın yetkisi kapalı. Kaydettiğiniz haber inceleme durumunda kalır." })] : []),
    el("div", { style: "display:flex;gap:.5rem;" }, [
      el("button", { class: "btn btn-ana", type: "submit", text: "Kaydet" }),
      el("button", { class: "btn btn-ikincil", type: "button", text: "Vazgeç", onclick: () => form.remove() })
    ])
  ]);
  alanYardimiEkle(kapakGorseli.urlInput, kapakGorseli.root, "haberler", "kapak_gorseli", "Kapak görseli", "image");
  kapakGorseli.fileInput.setAttribute("aria-describedby", kapakGorseli.urlInput.getAttribute("aria-describedby"));
  const durum = form.querySelector('[name="durum"]');
  const durumGrup = el("div", { class: "panel-form-alani" });
  durum.parentElement.after(durumGrup);
  alanYardimiEkle(durum, durumGrup, "haberler", "durum", "Durum");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.kapak_gorseli = kapakGorseli.urlInput.value.trim() || null;
    data.slug = data.slug.trim().toLocaleLowerCase("tr-TR").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!data.slug) {
      toastGoster("Geçerli bir URL kısa adı girin.", "hata");
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    let uploadedImage = null;
    try {
      if (kapakGorseli.fileInput.files?.[0]) {
        uploadedImage = await gorseliYukle(kapakGorseli.fileInput.files[0]);
        data.kapak_gorseli = uploadedImage.url;
      }
      if (haber) await db.update("haberler", haber.id, data);
      else await db.insert("haberler", data);
      toastGoster(haber ? "Haber güncellendi." : "Haber oluşturuldu.", "basari");
      await haberModulunuYukle(kapsayici);
    } catch (error) {
      if (uploadedImage) await db.removeStorageObject(uploadedImage.bucket, uploadedImage.objectPath).catch(() => {});
      toastGoster(error.message || "Kaydetme başarısız. Slug benzersiz mi ve yayın yetkiniz var mı kontrol edin.", "hata");
      submit.disabled = false;
    }
  });
  kapsayici.prepend(form);
}
