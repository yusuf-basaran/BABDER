import { db } from "../api.js";
import { el, toastGoster } from "../utils.js";
import { alanYardimiEkle, panelRehberiniGoster } from "./rehber.js";

export async function ayarlarModulunuYukle(kapsayici) {
  kapsayici.innerHTML = "";

  const baslikAlani = el("div", { style: "margin-bottom: 1.5rem;" }, [
    el("h2", { text: "Site ve Sistem Ayarları" }),
    el("p", { 
      text: "Dernek künye bilgileri, banka hesapları, hukuki metinler ve bakım modunu buradan yönetebilirsiniz.",
      style: "color: var(--renk-metin-soluk); font-size: 0.9rem;"
    })
  ]);
  kapsayici.appendChild(baslikAlani);

  const sekmeCubugu = el("div", { style: "display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--renk-sinir); padding-bottom: 0.5rem;" });
  const btnGenel = el("button", { class: "btn btn-ana", text: "Genel Künye & Banka" });
  const btnHukuki = el("button", { class: "btn btn-ikincil", text: "Hukuki Metinler (KVKK)" });
  const btnBakim = el("button", { class: "btn btn-ikincil", text: "Bakım & Sistem" });
  sekmeCubugu.append(btnGenel, btnHukuki, btnBakim);
  kapsayici.appendChild(sekmeCubugu);

  const icerikGosterici = el("div", { id: "ayarlar-sekme-icerik" });
  kapsayici.appendChild(icerikGosterici);

  btnGenel.addEventListener("click", () => {
    btnGenel.className = "btn btn-ana";
    btnHukuki.className = "btn btn-ikincil";
    btnBakim.className = "btn btn-ikincil";
    genelAyarlariGoster(icerikGosterici);
  });

  btnHukuki.addEventListener("click", () => {
    btnGenel.className = "btn btn-ikincil";
    btnHukuki.className = "btn btn-ana";
    btnBakim.className = "btn btn-ikincil";
    hukukiMetinleriGoster(icerikGosterici);
  });

  btnBakim.addEventListener("click", () => {
    btnGenel.className = "btn btn-ikincil";
    btnHukuki.className = "btn btn-ikincil";
    btnBakim.className = "btn btn-ana";
    bakimAyarlariniGoster(icerikGosterici);
  });

  await genelAyarlariGoster(icerikGosterici);
}

async function genelAyarlariGoster(hedef) {
  hedef.innerHTML = "";
  panelRehberiniGoster(document.getElementById("panel-kullanim-rehberi"), "ayarlar_genel", true);
  const form = el("form", { class: "kart", style: "max-width: 750px;" });

  let ayarlar;
  try { ayarlar = await db.select("ayarlar"); }
  catch { hedef.appendChild(el("p", { class: "kart", text: "Ayarlar yüklenemedi. Admin yetkisini ve bağlantıyı kontrol edin." })); return; }
  const ayarHarita = {};
  if (ayarlar) {
    ayarlar.forEach(a => ayarHarita[a.anahtar] = a.deger);
  }

  const alanlar = [
    { id: "dernek_unvan", etiket: "Resmi Dernek Unvanı", deger: ayarHarita.dernek_unvan || "" },
    { id: "kisa_ad", etiket: "Kısa Ad", deger: ayarHarita.kisa_ad || "BABDER" },
    { id: "facebook_url", etiket: "Facebook Sayfası URL", deger: ayarHarita.facebook_url || "", type: "url" },
    { id: "whatsapp_topluluk_url", etiket: "WhatsApp Topluluğu URL", deger: ayarHarita.whatsapp_topluluk_url || "", type: "url" },
    { id: "instagram_url", etiket: "Instagram Sayfası URL", deger: ayarHarita.instagram_url || "", type: "url" },
    { id: "telefon", etiket: "İletişim Telefonu", deger: ayarHarita.telefon || "" },
    { id: "eposta", etiket: "Resmi E-Posta", deger: ayarHarita.eposta || "" },
    { id: "adres", etiket: "Açık Merkez Adresi", deger: ayarHarita.adres || "" },
    { id: "kutuk_no", etiket: "Dernek Kütük Numarası", deger: ayarHarita.kutuk_no || "" },
    { id: "banka_adi", etiket: "Bağış Banka Adı", deger: ayarHarita.banka_adi || "" },
    { id: "iban", etiket: "Resmi IBAN Numarası", deger: ayarHarita.iban || "" }
  ];

  alanlar.forEach(a => {
    const grup = el("div", { class: "form-grup" }, [
      el("label", { for: a.id, text: a.etiket }),
      el("input", { type: a.type || "text", id: a.id, class: "form-denetim", value: a.deger })
    ]);
    alanYardimiEkle(grup.querySelector("input"), grup, "ayarlar", a.id, a.etiket);
    form.appendChild(grup);
  });

  const editorYayinInput = el("input", {
    type: "checkbox",
    id: "editor-yayinlayabilir",
    checked: ayarHarita.editor_yayinlayabilir === "true"
  });
  form.appendChild(el("label", { class: "form-grup", style: "display:flex;align-items:center;gap:.65rem;margin-top:1rem;", text: "Editörler içeriği doğrudan yayımlayabilsin" }, [editorYayinInput]));
  alanYardimiEkle(editorYayinInput, form, "ayarlar", "editor_yayinlayabilir", "Doğrudan yayın yetkisi");
  form.appendChild(el("p", { class: "form-yardim", text: "Kapalıyken editörlerin haber, duyuru, etkinlik ve sayfaları inceleme durumunda kaydedilir." }));

  const kaydetBtn = el("button", { type: "submit", class: "btn btn-ana", text: "Ayarları Güncelle", style: "margin-top: 1rem;" });
  form.appendChild(kaydetBtn);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    kaydetBtn.disabled = true;
    try {
      const degerler = alanlar.map(a => ({ ...a, yeniDeger: document.getElementById(a.id).value.trim() }));
      for (const a of degerler) {
        const yeniDeger = a.yeniDeger;
        if (a.type === "url" && yeniDeger) {
          let url;
          try { url = new URL(yeniDeger); } catch { throw new Error(`${a.etiket} geçerli bir URL olmalı.`); }
          if (url.protocol !== "https:") throw new Error(`${a.etiket} yalnızca HTTPS bağlantısı olabilir.`);
        }
      }
      for (const a of degerler) await db.update("ayarlar", a.id, { deger: a.yeniDeger });
      await db.update("ayarlar", "editor_yayinlayabilir", { deger: String(editorYayinInput.checked) });
      toastGoster("Genel ayarlar başarıyla kaydedildi.", "basari");
    } catch {
      toastGoster("Ayarlar güncellenirken yetki veya bağlantı hatası oluştu.", "hata");
    } finally {
      kaydetBtn.disabled = false;
    }
  });

  hedef.appendChild(form);
}

async function hukukiMetinleriGoster(hedef) {
  hedef.innerHTML = "";
  panelRehberiniGoster(document.getElementById("panel-kullanim-rehberi"), "ayarlar_hukuki", true);
  const kapsayici = el("div", { class: "kart", style: "max-width: 800px;" });

  kapsayici.appendChild(el("h3", { text: "Yasal Aydınlatma ve Politikalar" }));
  kapsayici.appendChild(el("p", { 
    text: "Uyarı: Yapılan her değişiklik yeni bir sürüm kaydı oluşturur. Hukuk onay kutusu işaretlenmeden yayına alınan metinler denetim kütüğünde onaysız olarak işaretlenir.",
    style: "font-size: 0.85rem; color: var(--renk-vurgu-koyu); margin-bottom: 1rem;"
  }));

  let metinler;
  try { metinler = await db.select("hukuki_metinler", "aktif=eq.true"); }
  catch { kapsayici.appendChild(el("p", { text: "Hukuki metinler yüklenemedi. Admin yetkisi gerekir." })); hedef.appendChild(kapsayici); return; }

  if (!metinler || metinler.length === 0) {
    kapsayici.appendChild(el("p", { text: "Henüz kayıtlı hukuki metin bulunamadı." }));
    hedef.appendChild(kapsayici);
    return;
  }

  metinler.forEach(m => {
    const blok = el("div", { style: "border: 1px solid var(--renk-sinir); padding: 1rem; border-radius: var(--yuvarlaklik); margin-bottom: 1rem;" });
    blok.appendChild(el("h4", { text: `${m.baslik} (Sürüm: ${m.surum})` }));

    const textarea = el("textarea", { class: "form-denetim", rows: 6, style: "margin: 0.5rem 0;" });
    textarea.value = m.icerik;
    textarea.setAttribute("aria-label", `${m.baslik} metni`);
    blok.appendChild(textarea);
    alanYardimiEkle(textarea, blok, "hukuki", "icerik", "Metin");

    const onayKutusuGrup = el("div", { style: "display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;" });
    const chk = el("input", { type: "checkbox", id: `chk-${m.id}`, checked: m.hukuk_onay });
    const lbl = el("label", { for: `chk-${m.id}`, text: "Dernek Hukuk Müşaviri / Avukat Onayından Geçti", style: "font-size: 0.85rem;" });
    onayKutusuGrup.append(chk, lbl);
    blok.appendChild(onayKutusuGrup);
    alanYardimiEkle(chk, blok, "hukuki", "hukuk_onay", "Hukuk onayı");

    const btnGuncelle = el("button", {
      class: "btn btn-ana",
      text: "Yeni Sürüm Olarak Kaydet",
      onclick: async () => {
        btnGuncelle.disabled = true;
        try {
          const yeniSurum = (parseFloat(m.surum) + 0.1).toFixed(1);
          await db.update("hukuki_metinler", m.id, {
            icerik: textarea.value.trim(),
            surum: yeniSurum,
            hukuk_onay: chk.checked,
            hukuk_onay_tarihi: chk.checked ? new Date().toISOString() : null
          });
          toastGoster(`${m.baslik} başarıyla v${yeniSurum} olarak güncellendi.`, "basari");
          hukukiMetinleriGoster(hedef);
        } catch {
          toastGoster("Güncelleme başarısız.", "hata");
        } finally {
          btnGuncelle.disabled = false;
        }
      }
    });
    blok.appendChild(btnGuncelle);
    kapsayici.appendChild(blok);
  });

  hedef.appendChild(kapsayici);
}

async function bakimAyarlariniGoster(hedef) {
  hedef.innerHTML = "";
  panelRehberiniGoster(document.getElementById("panel-kullanim-rehberi"), "ayarlar_bakim", true);
  const kart = el("div", { class: "kart", style: "max-width: 600px;" });

  kart.appendChild(el("h3", { text: "Bakım Modu Yönetimi" }));
  kart.appendChild(el("p", { 
    text: "Bakım modu etkinleştirildiğinde genel site ziyaretçileri bakim.html sayfasına yönlendirilir; yönetim paneli erişilebilir kalır.",
    style: "font-size: 0.85rem; color: var(--renk-metin-soluk); margin: 0.5rem 0 1rem 0;"
  }));

  let ayarlar;
  try { ayarlar = await db.select("ayarlar", "anahtar=in.(bakim_modu,bakim_mesaji)"); }
  catch { kart.appendChild(el("p", { text: "Bakım ayarları yüklenemedi." })); hedef.appendChild(kart); return; }
  let aktif = false;
  let mesaj = "";
  if (ayarlar) {
    ayarlar.forEach(a => {
      if (a.anahtar === "bakim_modu") aktif = (a.deger === "true");
      if (a.anahtar === "bakim_mesaji") mesaj = a.deger;
    });
  }

  const secimGrup = el("div", { class: "form-grup", style: "flex-direction: row; align-items: center; gap: 0.5rem;" });
  const bakimAnahtar = el("input", { type: "checkbox", id: "bakim-durum", checked: aktif });
  const bakimEtiket = el("label", { for: "bakim-durum", text: "Site Bakım Modunda (Yayını Durdur)" });
  secimGrup.append(bakimAnahtar, bakimEtiket);
  kart.appendChild(secimGrup);
  alanYardimiEkle(bakimAnahtar, kart, "ayarlar", "bakim_modu", "Bakım modu");

  const mesajGrup = el("div", { class: "form-grup" }, [
    el("label", { for: "bakim-metni", text: "Kullanıcıya Gösterilecek Bakım Mesajı" }),
    el("textarea", { id: "bakim-metni", class: "form-denetim", rows: 3, value: mesaj })
  ]);
  kart.appendChild(mesajGrup);
  alanYardimiEkle(mesajGrup.querySelector("textarea"), mesajGrup, "ayarlar", "bakim_mesaji", "Bakım mesajı");

  const kaydetBtn = el("button", {
    class: "btn btn-ana",
    text: "Bakım Durumunu Güncelle",
    onclick: async () => {
      kaydetBtn.disabled = true;
      try {
        await db.update("ayarlar", "bakim_modu", { deger: bakimAnahtar.checked ? "true" : "false" });
        await db.update("ayarlar", "bakim_mesaji", { deger: document.getElementById("bakim-metni").value.trim() });
        toastGoster("Bakım durumu kaydedildi.", "basari");
      } catch {
        toastGoster("İşlem gerçekleştirilemedi.", "hata");
      } finally {
        kaydetBtn.disabled = false;
      }
    }
  });
  kart.appendChild(kaydetBtn);

  hedef.appendChild(kart);
}
