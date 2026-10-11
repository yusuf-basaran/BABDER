import { db } from "../api.js";
import { el, toastGoster } from "../utils.js";

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

  const kayitlar = await db.select("islem_kayitlari", "order=created_at.desc&limit=50");
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

  const aramaKarti = el("div", { class: "kart", style: "max-width: 700px; margin-bottom: 1.5rem;" }, [
    el("h3", { text: "KVKK İlgili Kişi Veri Arama" }),
    el("p", { 
      text: "Kişinin e-posta adresini girerek başvuru, mesaj ve üyelik kayıtlarını tek sorguda görüntüleyebilir, dışa aktarabilir veya silebilirsiniz.",
      style: "font-size: 0.85rem; color: var(--renk-metin-soluk); margin: 0.5rem 0;"
    })
  ]);

  const aramaGrup = el("div", { style: "display: flex; gap: 0.5rem; margin-top: 1rem;" });
  const aramaInput = el("input", { type: "email", class: "form-denetim", placeholder: "ornek@eposta.com", style: "flex: 1;" });
  const araBtn = el("button", { class: "btn btn-ana", text: "Kişiyi Ara" });
  aramaGrup.append(aramaInput, araBtn);
  aramaKarti.appendChild(aramaGrup);
  hedef.appendChild(aramaKarti);

  const sonucAlani = el("div", { id: "kvkk-sonuc-alani" });
  hedef.appendChild(sonucAlani);

  araBtn.addEventListener("click", async () => {
    const eposta = aramaInput.value.trim();
    if (!eposta) {
      toastGoster("Lütfen geçerli bir e-posta giriniz.", "hata");
      return;
    }
    sonucAlani.innerHTML = "<p>Veriler sorgulanıyor...</p>";

    const basvurular = await db.select("uyelik_basvurulari", `eposta=eq.${eposta}`);
    const mesajlar = await db.select("iletisim_mesajlari", `eposta=eq.${eposta}`);
    const uyeler = await db.select("uyeler", `eposta=eq.${eposta}`);

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
            if (basvurular) for (const b of basvurular) await db.delete("uyelik_basvurulari", b.id);
            if (mesajlar) for (const m of mesajlar) await db.delete("iletisim_mesajlari", m.id);
            if (uyeler) for (const u of uyeler) await db.delete("uyeler", u.id);
            toastGoster("Kişisel veriler mevzuat uyarınca imha edildi.", "basari");
            sonucAlani.innerHTML = "";
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
  const kart = el("div", { class: "kart" }, [
    el("h3", { text: "Silinen Kayıtlar (Çöp Kutusu)" }),
    el("p", { 
      text: "Buradaki kayıtlar sistemden tamamen kaldırılmamış, deleted_at ile işaretlenmiştir. Yalnızca admin kalıcı silebilir.",
      style: "font-size: 0.85rem; color: var(--renk-metin-soluk); margin-bottom: 1rem;"
    })
  ]);

  const silinenHaberler = await db.select("haberler", "deleted_at=not.is.null");

  if (!silinenHaberler || silinenHaberler.length === 0) {
    kart.appendChild(el("p", { text: "Çöp kutusu boş." }));
  } else {
    const liste = el("ul", { style: "list-style: none;" });
    silinenHaberler.forEach(h => {
      const li = el("li", { style: "padding: 0.5rem 0; border-bottom: 1px solid var(--renk-sinir); display: flex; justify-content: space-between; align-items: center;" }, [
        el("span", { text: `${h.baslik} (Silinme: ${new Date(h.deleted_at).toLocaleDateString("tr-TR")})` }),
        el("button", {
          class: "btn btn-ikincil",
          text: "Geri Yükle",
          onclick: async () => {
            await db.update("haberler", h.id, { deleted_at: null });
            toastGoster("Haber geri yüklendi.", "basari");
            copKutusunuGoster(hedef);
          }
        })
      ]);
      liste.appendChild(li);
    });
    kart.appendChild(liste);
  }

  hedef.appendChild(kart);
}
