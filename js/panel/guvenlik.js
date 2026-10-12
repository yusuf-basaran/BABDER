import { db } from "../api.js";
import { el, toastGoster } from "../utils.js";
import { alanYardimiEkle, panelRehberiniGoster } from "./rehber.js";

export async function guvenlikModulunuYukle(kapsayici) {
  kapsayici.innerHTML = "";

  const baslikAlani = el("div", { style: "margin-bottom: 1.5rem;" }, [
    el("h2", { text: "Güvenlik, Denetim & KVKK Araçları" }),
    el("p", { 
      text: "İşlem kayıtlarını inceleyebilir, silinen kayıtları yönetebilir ve 6698 sayılı KVKK kapsamındaki veri sahibi haklarını işleyebilirsiniz.",
      style: "color: var(--renk-metin-soluk); font-size: 0.9rem;"
    })
  ]);
  kapsayici.appendChild(baslikAlani);

  const sekmeCubugu = el("div", { style: "display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--renk-sinir); padding-bottom: 0.5rem;" });
  const btnIslem = el("button", { class: "btn btn-ana", text: "İşlem Kütüğü (Loglar)" });
  const btnKvkk = el("button", { class: "btn btn-ikincil", text: "KVKK Veri Arama & İmha" });
  const btnCop = el("button", { class: "btn btn-ikincil", text: "Çöp Kutusu (Soft Delete)" });
  sekmeCubugu.append(btnIslem, btnKvkk, btnCop);
  kapsayici.appendChild(sekmeCubugu);

  const icerikAlani = el("div", { id: "guvenlik-icerik" });
  kapsayici.appendChild(icerikAlani);

  btnIslem.addEventListener("click", () => {
    btnIslem.className = "btn btn-ana";
    btnKvkk.className = "btn btn-ikincil";
    btnCop.className = "btn btn-ikincil";
    islemKayitlariniGoster(icerikAlani);
  });

  btnKvkk.addEventListener("click", () => {
    btnIslem.className = "btn btn-ikincil";
    btnKvkk.className = "btn btn-ana";
    btnCop.className = "btn btn-ikincil";
    kvkkAraclariniGoster(icerikAlani);
  });

  btnCop.addEventListener("click", () => {
    btnIslem.className = "btn btn-ikincil";
    btnKvkk.className = "btn btn-ikincil";
    btnCop.className = "btn btn-ana";
    copKutusunuGoster(icerikAlani);
  });

  await islemKayitlariniGoster(icerikAlani);
}

async function islemKayitlariniGoster(hedef) {
  hedef.innerHTML = "";
  panelRehberiniGoster(document.getElementById("panel-kullanim-rehberi"), "guvenlik_log", true);

  const tabloKapsayici = el("div", { class: "veri-tablosu-kapsayici" });
  const tablo = el("table", { class: "veri-tablosu" }, [
    el("thead", {}, [
      el("tr", {}, [
        el("th", { text: "Tarih / Saat" }),
        el("th", { text: "İşlem Türü" }),
        el("th", { text: "Etkilenen Tablo" }),
        el("th", { text: "Hassas İşlem" })
      ])
    ]),
    el("tbody", { id: "log-tablo-govde" })
  ]);
  tabloKapsayici.appendChild(tablo);
  hedef.appendChild(tabloKapsayici);

  let kayitlar;
  try { kayitlar = await db.select("islem_kayitlari", "order=created_at.desc&limit=50"); }
  catch { hedef.appendChild(el("p", { class: "kart", text: "İşlem kayıtları yüklenemedi. Admin yetkisini ve bağlantıyı kontrol edin." })); return; }
  const govde = document.getElementById("log-tablo-govde");

  if (!kayitlar || kayitlar.length === 0) {
    govde.appendChild(el("tr", {}, [el("td", { colSpan: 4, text: "Kayıtlı sistem hareketi bulunmuyor." })]));
    return;
  }

  kayitlar.forEach(k => {
    const satir = el("tr", {}, [
      el("td", { text: new Date(k.created_at).toLocaleString("tr-TR") }),
      el("td", { text: k.eylem }),
      el("td", { text: k.tablo_adi }),
      el("td", { text: k.hassas_islem ? "Evet (Önemli)" : "Standart", style: k.hassas_islem ? "color: var(--renk-hata); font-weight: bold;" : "" })
    ]);
    govde.appendChild(satir);
  });
}

async function kvkkAraclariniGoster(hedef) {
  hedef.innerHTML = "";
  panelRehberiniGoster(document.getElementById("panel-kullanim-rehberi"), "guvenlik_kvkk", true);

  const aramaKarti = el("div", { class: "kart", style: "max-width: 700px; margin-bottom: 1.5rem;" }, [
    el("h3", { text: "KVKK İlgili Kişi Veri Arama" }),
    el("p", { 
      text: "Kişinin e-posta adresini girerek başvuru, mesaj ve üyelik kayıtlarını tek sorguda görüntüleyebilir, dışa aktarabilir veya silebilirsiniz.",
      style: "font-size: 0.85rem; color: var(--renk-metin-soluk); margin: 0.5rem 0;"
    })
  ]);

  const aramaGrup = el("div", { style: "display: flex; gap: 0.5rem; margin-top: 1rem;" });
  const aramaInput = el("input", { type: "email", class: "form-denetim", placeholder: "ornek@eposta.com", style: "flex: 1;" });
  aramaInput.setAttribute("aria-label", "Aranacak kişinin e-posta adresi");
  const araBtn = el("button", { class: "btn btn-ana", text: "Kişiyi Ara" });
  aramaGrup.append(aramaInput, araBtn);
  aramaKarti.appendChild(aramaGrup);
  alanYardimiEkle(aramaInput, aramaKarti, "guvenlik", "kvkk_eposta", "E-posta");
  hedef.appendChild(aramaKarti);

  const sonucAlani = el("div", { id: "kvkk-sonuc-alani" });
  hedef.appendChild(sonucAlani);

  araBtn.addEventListener("click", async () => {
    const eposta = aramaInput.value.trim();
    if (!eposta) {
      toastGoster("Lütfen geçerli bir e-posta giriniz.", "hata");
      return;
    }
    sonucAlani.replaceChildren(el("p", { text: "Veriler sorgulanıyor..." }));

    let basvurular, mesajlar, uyeler;
    try {
      const filtre = encodeURIComponent(eposta.replace(/[\\%_]/g, "\\$&"));
      [basvurular, mesajlar, uyeler] = await Promise.all([
        db.select("uyelik_basvurulari", `eposta=ilike.${filtre}`),
        db.select("iletisim_mesajlari", `eposta=ilike.${filtre}`),
        db.select("uyeler", `eposta=ilike.${filtre}`)
      ]);
    } catch {
      sonucAlani.replaceChildren(el("p", { class: "kart", text: "Kayıtlar aranamadı. Veritabanı erişimini kontrol edin." }));
      return;
    }

    sonucAlani.innerHTML = "";
    const sonucKart = el("div", { class: "kart", style: "max-width: 700px;" }, [
      el("h4", { text: `Bulunan Kayıtlar: ${eposta}` }),
      el("ul", { style: "margin: 0.5rem 0 1rem 1.5rem;" }, [
        el("li", { text: `Üyelik Başvurusu: ${basvurular ? basvurular.length : 0} adet` }),
        el("li", { text: `İletişim Mesajı: ${mesajlar ? mesajlar.length : 0} adet` }),
        el("li", { text: `Aktif/Pasif Üyelik: ${uyeler ? uyeler.length : 0} adet` })
      ])
    ]);

    const butonGrup = el("div", { style: "display: flex; gap: 1rem;" });
    const btnIndir = el("button", {
      class: "btn btn-ikincil",
      text: "Verileri İndir (JSON)",
      onclick: () => {
        const tumVeri = { eposta, sorgu_tarihi: new Date().toISOString(), basvurular, mesajlar, uyeler };
        const blob = new Blob([JSON.stringify(tumVeri, null, 2)], { type: "application/json" });
        const a = el("a", { href: URL.createObjectURL(blob), download: `kvkk_veri_${eposta}.json` });
        a.click();
      }
    });

    const btnSil = el("button", {
      class: "btn btn-ana",
      style: "background-color: var(--renk-hata);",
      text: "Tüm Verileri Kalıcı Sil (KVKK İmha)",
      onclick: async () => {
        if (confirm(`${eposta} adresine ait TÜM kişisel veriler geri döndürülemez şekilde silinecektir. Onaylıyor musunuz?`)) {
          btnSil.disabled = true;
          try {
            const silinenler = await db.rpc("kvkk_kisi_verilerini_sil", { p_eposta: eposta });
            toastGoster(`Silme tamamlandı: ${silinenler.basvurular} başvuru, ${silinenler.mesajlar} mesaj, ${silinenler.uyeler} üye kaydı.`, "basari");
            sonucAlani.replaceChildren(el("p", { role: "status", "aria-live": "polite", text: `Silme tamamlandı: ${silinenler.basvurular} başvuru, ${silinenler.mesajlar} mesaj, ${silinenler.uyeler} üye kaydı.` }));
            aramaInput.value = "";
          } catch {
            toastGoster("Silme işlemi esnasında hata oluştu.", "hata");
          } finally {
            btnSil.disabled = false;
          }
        }
      }
    });

    butonGrup.append(btnIndir, btnSil);
    sonucKart.appendChild(butonGrup);
    sonucAlani.appendChild(sonucKart);
  });
}

async function copKutusunuGoster(hedef) {
  hedef.innerHTML = "";
  panelRehberiniGoster(document.getElementById("panel-kullanim-rehberi"), "guvenlik_cop", true);
  const kart = el("div", { class: "kart" }, [
    el("h3", { text: "Silinen Kayıtlar (Çöp Kutusu)" }),
    el("p", { 
      text: "Silinen kayıtları geri yükleyebilir veya kalıcı silebilirsiniz. Kalıcı silme geri alınamaz.",
      style: "font-size: 0.85rem; color: var(--renk-metin-soluk); margin-bottom: 1rem;"
    })
  ]);
  hedef.appendChild(kart);
  const tables = [
    ["sayfalar", "baslik"], ["haberler", "baslik"], ["duyurular", "baslik"], ["etkinlikler", "baslik"],
    ["albumler", "baslik"], ["galeri", "alt_metin"], ["yonetim_kurulu", "ad_soyad"], ["koyler", "ad"],
    ["belgeler", "baslik"], ["uyelik_basvurulari", "ad_soyad"], ["iletisim_mesajlari", "konu"], ["uyeler", "ad_soyad"]
  ];
  const list = el("div");
  hedef.appendChild(list);
  let total = 0;
  for (const [table, label] of tables) {
    let rows;
    try { rows = await db.select(table, "deleted_at=not.is.null&order=created_at.desc"); }
    catch { continue; }
    for (const row of rows || []) {
      total++;
      const item = el("div", { class: "kart", style: "display:flex;justify-content:space-between;align-items:center;gap:1rem;margin:.5rem 0;" }, [
        el("span", { text: `${table} · ${row[label] || row.id} · ${new Date(row.deleted_at).toLocaleDateString("tr-TR")}` }),
        el("div", {}, [
          el("button", { class: "btn btn-ikincil", text: "Geri yükle", onclick: async () => { try { await db.update(table, row.id, { deleted_at: null }); toastGoster("Kayıt geri yüklendi.", "basari"); await copKutusunuGoster(hedef); } catch { toastGoster("Geri yükleme başarısız.", "hata"); } } }),
          el("button", { class: "btn btn-ikincil", text: "Kalıcı sil", onclick: async () => { if (!confirm("Bu kayıt ve varsa bağlı veriler kalıcı olarak silinecek. Devam edilsin mi?")) return; try { await db.delete(table, row.id); toastGoster("Kayıt kalıcı silindi.", "basari"); await copKutusunuGoster(hedef); } catch { toastGoster("Kalıcı silme başarısız.", "hata"); } } })
        ])
      ]);
      list.appendChild(item);
    }
  }
  if (!total) kart.appendChild(el("p", { text: "Çöp kutusu boş veya kayıtlar erişim nedeniyle görüntülenemedi." }));
}
