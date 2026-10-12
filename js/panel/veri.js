import { db } from "../api.js";
import { el, toastGoster } from "../utils.js";
import { gorselAlaniniOlustur, gorseliYukle, gorseliWebpSikistir } from "./medya.js";
import { alanYardimiEkle, panelRehberiniGoster } from "./rehber.js";

const METIN = (name, label, options = {}) => ({ name, label, type: "text", ...options });
const AREA = (name, label, options = {}) => ({ name, label, type: "textarea", ...options });
const SELECT = (name, label, options) => ({ name, label, type: "select", options });
const BOOL = (name, label) => ({ name, label, type: "checkbox" });
const GORSEL = (name, label, options = {}) => ({ name, label, type: "image", ...options });
const BELGE = (name, label, options = {}) => ({ name, label, type: "document", ...options });
const DURUM = ["taslak", "incelemede", "yayinda", "arsiv"].map(x => [x, x]);

const MODULLER = {
  duyurular: { title: "Duyurular", table: "duyurular", columns: ["baslik", "durum", "yayin_tarihi", "bitis_tarihi"], fields: [METIN("baslik", "Başlık"), AREA("icerik", "İçerik"), BOOL("sabit", "Üste sabitle"), BOOL("bantta_goster", "Duyuru bandında göster"), METIN("bitis_tarihi", "Bitiş tarihi", { type: "datetime-local", nullable: true }), SELECT("durum", "Durum", DURUM)], softDelete: true },
  etkinlikler: { title: "Etkinlikler", table: "etkinlikler", columns: ["baslik", "tur", "konum", "baslangic_tarihi", "durum"], fields: [METIN("baslik", "Etkinlik adı"), SELECT("tur", "Tür", [["etkinlik", "Etkinlik"], ["genel_kurul", "Genel kurul"], ["toplanti", "Toplantı"]]), AREA("aciklama", "Açıklama"), AREA("gundem", "Gündem", { nullable: true }), METIN("baslangic_tarihi", "Başlangıç", { type: "datetime-local" }), METIN("bitis_tarihi", "Bitiş", { type: "datetime-local", nullable: true }), METIN("konum", "Konum"), BELGE("tutanak_belge_id", "Tutanak PDF belgesi", { nullable: true }), GORSEL("gorsel_url", "Görsel", { nullable: true }), SELECT("durum", "Durum", DURUM)], softDelete: true },
  taziyeler: { title: "Vefat / Taziye Duyuruları", table: "taziyeler", columns: ["ad_soyad", "koy", "cenaze_tarihi", "durum"], fields: [METIN("ad_soyad", "Vefat eden kişinin adı"), METIN("koy", "Köy"), AREA("aciklama", "Açıklama", { nullable: true }), METIN("cenaze_yeri", "Cenaze yeri"), METIN("cenaze_tarihi", "Cenaze tarihi ve saati", { type: "datetime-local" }), METIN("yayin_tarihi", "Yayın başlangıcı", { type: "datetime-local" }), METIN("bitis_tarihi", "Yayından kalkma tarihi", { type: "datetime-local", nullable: true }), BOOL("aile_izni", "Aileden yayın izni alındı"), SELECT("durum", "Durum", DURUM)], softDelete: true },
  kampanyalar: { title: "Bağış Kampanyaları", table: "kampanyalar", columns: ["baslik", "hedef_tutar", "toplanan_tutar", "bitis_tarihi", "durum"], fields: [METIN("baslik", "Kampanya başlığı"), AREA("aciklama", "Açıklama"), METIN("hedef_tutar", "Hedef tutar", { type: "number", min: 0.01, step: 0.01 }), METIN("toplanan_tutar", "Toplanan tutar", { type: "number", min: 0, step: 0.01 }), METIN("bitis_tarihi", "Bitiş tarihi", { type: "datetime-local", nullable: true }), GORSEL("gorsel_url", "Görsel", { nullable: true }), SELECT("durum", "Durum", DURUM)], softDelete: true },
  koyler: { title: "Köyler", table: "koyler", columns: ["ad", "enlem", "boylam", "sira"], fields: [METIN("ad", "Köy adı"), AREA("kisa_tanitim", "Kısa tanıtım"), AREA("detay_bilgi", "Detaylı bilgi"), GORSEL("kapak_gorseli", "Kapak görseli", { nullable: true }), METIN("enlem", "Enlem", { type: "number", min: -90, max: 90, step: 0.000001, nullable: true }), METIN("boylam", "Boylam", { type: "number", min: -180, max: 180, step: 0.000001, nullable: true }), METIN("sira", "Sıra", { type: "number" })], softDelete: true },
  galeri: { title: "Galeri", table: "galeri", columns: ["alt_metin", "gorsel_url", "sira"], fields: [GORSEL("gorsel_url", "Görsel"), METIN("alt_metin", "Alternatif metin"), METIN("album_id", "Albüm", { type: "album", nullable: true }), METIN("sira", "Sıra", { type: "number" })], softDelete: true },
  mesajlar: { title: "İletişim Mesajları", table: "iletisim_mesajlari", columns: ["ad_soyad", "eposta", "konu", "mesaj", "okundu", "created_at"], fields: [], softDelete: false, messages: true },
  uyeler: { title: "Üyeler", table: "uyeler", columns: ["uye_no", "ad_soyad", "telefon", "eposta", "koy_bagi", "durum"], fields: [METIN("uye_no", "Üye numarası"), METIN("ad_soyad", "Ad soyad"), METIN("telefon", "Telefon"), METIN("eposta", "E-posta", { nullable: true }), METIN("koy_bagi", "Köy bağı"), SELECT("durum", "Durum", [["aktif", "Aktif"], ["pasif", "Pasif"], ["ayrildi", "Ayrıldı"]]), METIN("giris_tarihi", "Üyelik başlangıcı", { type: "date" })], softDelete: true },
  sayfalar: { title: "Sayfalar", table: "sayfalar", columns: ["baslik", "slug", "durum"], fields: [METIN("baslik", "Başlık"), METIN("slug", "URL kısa adı"), METIN("meta_aciklama", "Meta açıklaması", { nullable: true }), SELECT("durum", "Durum", DURUM)], softDelete: true },
  sayfa_bolumleri: { title: "Sayfa Bölümleri", table: "sayfa_bolumleri", columns: ["sayfa_id", "bolum_kodu", "baslik", "sira"], fields: [METIN("sayfa_id", "Sayfa", { type: "page" }), METIN("bolum_kodu", "Bölüm kodu"), METIN("baslik", "Başlık", { nullable: true }), AREA("icerik", "İçerik"), METIN("sira", "Sıra", { type: "number" })], softDelete: false },
  anasayfa: { title: "Ana sayfa bölümleri", table: "anasayfa_bolumleri", columns: ["kod", "baslik", "sira", "aktif"], fields: [METIN("kod", "Kod"), METIN("baslik", "Başlık"), METIN("alt_baslik", "Alt başlık", { nullable: true }), AREA("icerik", "İçerik"), METIN("buton_metin", "Buton metni", { nullable: true }), METIN("buton_baglanti", "Buton bağlantısı", { nullable: true }), GORSEL("gorsel_url", "Görsel", { nullable: true }), METIN("sira", "Sıra", { type: "number" }), BOOL("aktif", "Yayında")], softDelete: false },
  menu: { title: "Menü öğeleri", table: "menu_ogeleri", columns: ["baslik", "baglanti", "konum", "sira", "aktif"], fields: [METIN("baslik", "Başlık"), METIN("baglanti", "Bağlantı"), METIN("konum", "Konum"), METIN("sira", "Sıra", { type: "number" }), BOOL("aktif", "Etkin")], softDelete: false },
  kurul: { title: "Yönetim Kurulu", table: "yonetim_kurulu", columns: ["ad_soyad", "gorev", "kurul_turu", "donem", "sira"], fields: [METIN("ad_soyad", "Ad soyad"), METIN("gorev", "Görev"), METIN("kurul_turu", "Kurul türü"), METIN("donem", "Dönem"), GORSEL("fotograf_url", "Fotoğraf", { nullable: true }), METIN("sira", "Sıra", { type: "number" })], softDelete: true },
  belgeler: { title: "Belgeler", table: "belgeler", columns: ["baslik", "kategori", "surum", "durum"], fields: [METIN("baslik", "Başlık"), METIN("kategori", "Kategori"), METIN("dosya_url", "Dosya URL"), METIN("surum", "Sürüm"), SELECT("durum", "Durum", DURUM)], softDelete: true },
  hukuki: { title: "Hukuki Metinler", table: "hukuki_metinler", columns: ["kod", "baslik", "surum", "hukuk_onay", "aktif"], fields: [METIN("kod", "Kod"), METIN("baslik", "Başlık"), AREA("icerik", "İçerik"), METIN("surum", "Sürüm"), METIN("yururluk_tarihi", "Yürürlük tarihi", { type: "date" }), BOOL("hukuk_onay", "Hukuk onayından geçti"), BOOL("aktif", "Yayında")], softDelete: false },
  albumler: { title: "Albüm Yönetimi", table: "albumler", columns: ["baslik", "aciklama", "kapak_gorseli", "sira"], fields: [METIN("baslik", "Albüm başlığı"), AREA("aciklama", "Açıklama"), GORSEL("kapak_gorseli", "Kapak görseli", { nullable: true }), METIN("sira", "Sıra", { type: "number" })], softDelete: true },
  surumler: { title: "İçerik Sürüm Geçmişi", table: "surumler", columns: ["tablo_adi", "kayit_id", "degistiren", "created_at", "veri"], fields: [], softDelete: false, readOnly: true },
  yoneticiler: { title: "Yönetici ve Roller", table: "yoneticiler", columns: ["ad", "user_id", "rol", "aktif"], fields: [METIN("user_id", "Mevcut Supabase Auth kullanıcı UUID’si"), METIN("ad", "Yönetici adı"), SELECT("rol", "Rol", [["admin", "Admin"], ["editor", "Editör"], ["goruntuleyici", "Görüntüleyici"]]), BOOL("aktif", "Aktif")], softDelete: false }
};

export async function veriModulunuYukle(root, key) {
  if (key === "medya") return medyaModulunuYukle(root);
  const cfg = MODULLER[key];
  if (!cfg) return;
  root.replaceChildren();
  const canEdit = ["admin", "editor"].includes(window.BABDER_ROLE) && !(key === "hukuki" && window.BABDER_ROLE !== "admin");
  root.appendChild(el("h2", { text: cfg.title }));
  if (cfg.fields.length && canEdit) root.appendChild(el("button", { class: "btn btn-ana", text: "Yeni kayıt ekle", onclick: () => kayitFormu(root, cfg) }));
  if (key === "uyeler") {
    root.appendChild(el("button", { class: "btn btn-ikincil", text: "Aidat kayıtlarını yönet", style: "margin-left:.5rem;", onclick: () => aidatlarGoster(root) }));
  }
  const search = el("input", { class: "form-denetim", type: "search", placeholder: "Kayıtlarda ara…", style: "max-width:360px;margin:1rem 0;" });
  root.appendChild(search);
  const wrap = el("div", { class: "veri-tablosu-kapsayici" });
  const table = el("table", { class: "veri-tablosu" });
  const tbody = el("tbody");
  const sutunAdlari = { created_at: "Kayıt tarihi", okundu: "Okundu mu?", mesaj: "Mesaj", konu: "Konu", tablo_adi: "Bölüm", kayit_id: "Kayıt numarası", degistiren: "Değiştiren kullanıcı", veri: "Önceki kayıt bilgileri", yayin_tarihi: "Yayın tarihi", eposta: "E-posta", ad_soyad: "Ad soyad" };
  table.append(el("thead", {}, [el("tr", {}, [...cfg.columns.map(c => el("th", { text: cfg.fields.find(field => field.name === c)?.label || sutunAdlari[c] || c })), el("th", { text: "İşlemler" })])]), tbody);
  wrap.appendChild(table);
  root.appendChild(wrap);
  let rows;
  try {
    rows = await db.select(cfg.table, cfg.softDelete ? "deleted_at=is.null&order=created_at.desc" : "order=created_at.desc");
  } catch {
    tbody.appendChild(el("tr", {}, [el("td", { colSpan: cfg.columns.length + 1, text: "Kayıtlar alınamadı. Rol izinlerini ve Supabase bağlantısını kontrol edin." })]));
    return;
  }
  const draw = query => {
    tbody.replaceChildren();
    const found = rows.filter(row => !query || cfg.columns.some(col => String(row[col] ?? "").toLocaleLowerCase("tr").includes(query)));
    if (!found.length) tbody.appendChild(el("tr", {}, [el("td", { colSpan: cfg.columns.length + 1, text: "Kayıt bulunamadı." })]));
    for (const row of found) {
      const cells = cfg.columns.map(col => {
        if (cfg.messages && col === "mesaj") return el("td", {}, [el("details", {}, [el("summary", { text: "Mesajı aç" }), el("p", { text: row.mesaj })])]);
        const value = row[col];
        if (cfg.table === "sayfalar" && col === "slug") return el("td", {}, [el("a", { href: `/sayfalar/sayfa.html?slug=${encodeURIComponent(value)}`, target: "_blank", rel: "noopener noreferrer", text: value || "—" })]);
        const text = col.endsWith("_tarihi") || col === "created_at" ? (value ? new Date(value).toLocaleString("tr-TR") : "—") : value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "—");
        return el("td", { text });
      });
      const actions = [];
      if (cfg.messages && canEdit) actions.push(el("button", { class: "btn btn-ikincil", text: row.okundu ? "Okunmadı işaretle" : "Okundu işaretle", onclick: () => guncelle(root, cfg, row, { okundu: !row.okundu }) }));
      if (cfg.messages && canEdit) actions.push(el("button", { class: "btn btn-ikincil", text: "Not ekle/düzenle", onclick: async () => { const note = prompt("Yalnızca yönetimin göreceği iç not:", row.ic_not || ""); if (note === null) return; await guncelle(root, cfg, row, { ic_not: note.trim() || null }); } }));
      if (cfg.fields.length && canEdit && !cfg.messages) actions.push(el("button", { class: "btn btn-ikincil", text: "Düzenle", onclick: () => kayitFormu(root, cfg, row) }));
      if (canEdit && cfg.messages && window.BABDER_ROLE === "admin") actions.push(el("button", { class: "btn btn-ikincil", text: "Sil", onclick: () => sil(root, cfg, row) }));
      if (canEdit && !cfg.messages && !cfg.readOnly) actions.push(el("button", { class: "btn btn-ikincil", text: "Sil", onclick: () => sil(root, cfg, row) }));
      tbody.appendChild(el("tr", {}, [...cells, el("td", {}, actions)]));
    }
  };
  search.addEventListener("input", () => draw(search.value.trim().toLocaleLowerCase("tr")));
  draw("");
}

async function kayitFormu(root, cfg, row = null) {
  const form = el("form", { class: "kart", style: "max-width:760px;margin:1rem 0;" });
  form.appendChild(el("h3", { text: row ? "Kaydı düzenle" : "Yeni kayıt" }));
  const yayinDurumTablolari = new Set(["sayfalar", "haberler", "duyurular", "etkinlikler", "taziyeler"]);
  let editorYayinlayabilir = window.BABDER_ROLE === "admin";
  if (window.BABDER_ROLE === "editor" && yayinDurumTablolari.has(cfg.table)) {
    editorYayinlayabilir = await db.select("ayarlar", "anahtar=eq.editor_yayinlayabilir&select=deger&limit=1")
      .then(rows => rows[0]?.deger === "true").catch(() => false);
  }
  const controls = {};
  const imageFields = {};
  let albums = [];
  let pages = [];
  let documents = [];
  if (cfg.fields.some(field => field.type === "album")) {
    try { albums = await db.select("albumler", "deleted_at=is.null&order=baslik.asc"); }
    catch { toastGoster("Albüm listesi alınamadı.", "hata"); return; }
  }
  if (cfg.fields.some(field => field.type === "page")) {
    try { pages = await db.select("sayfalar", "deleted_at=is.null&order=baslik.asc"); }
    catch { toastGoster("Sayfa listesi alınamadı.", "hata"); return; }
  }
  if (cfg.fields.some(field => field.type === "document")) {
    try { documents = await db.select("belgeler", "order=baslik.asc"); }
    catch { toastGoster("Belge listesi alınamadı.", "hata"); return; }
  }
  for (const field of cfg.fields) {
    const attrs = { name: field.name, class: "form-denetim", required: field.type !== "checkbox" && !field.nullable };
    if (field.type === "textarea") controls[field.name] = el("textarea", { ...attrs, rows: 4, text: row?.[field.name] ?? "" });
    else if (field.type === "select") {
      let options = field.options;
      if (field.name === "durum" && !editorYayinlayabilir && yayinDurumTablolari.has(cfg.table)) {
        options = options.filter(([value]) => value !== "yayinda" || row?.durum === "yayinda");
      }
      controls[field.name] = el("select", attrs, options.map(([value, label]) => el("option", { value, text: label, selected: (row?.[field.name] ?? options[0][0]) === value })));
    }
    else if (field.type === "album") controls[field.name] = el("select", attrs, [el("option", { value: "", text: "Albüm seçmeden ekle", selected: !row?.album_id }), ...albums.map(album => el("option", { value: album.id, text: album.baslik, selected: row?.album_id === album.id }))]);
    else if (field.type === "page") controls[field.name] = el("select", attrs, [el("option", { value: "", text: "Sayfa seçin" }), ...pages.map(page => el("option", { value: page.id, text: `${page.baslik} (${page.slug})`, selected: row?.sayfa_id === page.id }))]);
    else if (field.type === "document") controls[field.name] = el("select", attrs, [el("option", { value: "", text: "Tutanak belgesi seçin", selected: !row?.[field.name] }), ...documents.map(doc => el("option", { value: doc.id, text: `${doc.baslik} (${doc.kategori})`, selected: row?.[field.name] === doc.id }))]);
    else if (field.type === "image") {
      imageFields[field.name] = gorselAlaniniOlustur(row?.[field.name] || "", false);
      controls[field.name] = imageFields[field.name].urlInput;
    }
    else {
      const inputAttrs = { ...attrs, type: field.type };
      if (field.type === "checkbox") inputAttrs.checked = Boolean(row?.[field.name]);
      else inputAttrs.value = formatValue(row?.[field.name], field.type);
      if (field.type === "number") {
        inputAttrs.min = field.min ?? 0;
        if (field.max !== undefined) inputAttrs.max = field.max;
        if (field.step !== undefined) inputAttrs.step = field.step;
      }
      controls[field.name] = el("input", inputAttrs);
    }
    const grup = el("div", { class: "panel-form-alani" }, [el("label", { class: "form-grup", text: field.label }, [field.type === "image" ? imageFields[field.name].root : controls[field.name]])]);
    const key = Object.keys(MODULLER).find(k => MODULLER[k] === cfg);
    alanYardimiEkle(controls[field.name], grup, key, field.name, field.label, field.type);
    if (field.type !== "checkbox") grup.appendChild(el("p", { class: "panel-alan-gereklilik", text: field.nullable ? "İsteğe bağlı: boş bırakabilirsiniz." : "Bu alan zorunludur." }));
    if (field.type === "image") imageFields[field.name].fileInput.setAttribute("aria-describedby", controls[field.name].getAttribute("aria-describedby"));
    form.appendChild(grup);
  }
  if (window.BABDER_ROLE === "editor" && yayinDurumTablolari.has(cfg.table) && !editorYayinlayabilir) {
    form.appendChild(el("p", { class: "form-yardim", role: "status", text: "Yayın yetkisi kapalı. Yeni içerikler inceleme durumunda kalır." }));
  }
  form.append(el("button", { class: "btn btn-ana", type: "submit", text: "Kaydet" }), el("button", { class: "btn btn-ikincil", type: "button", text: "Vazgeç", onclick: () => form.remove() }));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = {};
    const uploadedImages = [];
    try {
      for (const field of cfg.fields) {
        const control = controls[field.name];
        let value = field.type === "checkbox" ? control.checked : control.value.trim();
        if (field.type === "image" && imageFields[field.name].fileInput.files?.[0]) {
          const uploaded = await gorseliYukle(imageFields[field.name].fileInput.files[0]);
          uploadedImages.push(uploaded);
          value = uploaded.url;
        }
        if (field.type === "image" && !field.nullable && !value) throw new Error(`${field.label} seçin veya URL girin.`);
        if (value === "" && field.nullable) value = null;
        if (field.type === "datetime-local" && value) value = new Date(value).toISOString();
        if (field.type === "number" && value !== "") value = Number(value);
        data[field.name] = value;
      }
      if (cfg.table === "taziyeler" && data.durum === "yayinda" && data.aile_izni !== true) {
        throw new Error("Taziye duyurusunu yayımlamak için aile izni onay kutusunu işaretleyin.");
      }
      if (cfg.table === "yoneticiler" && row) {
        const currentUser = JSON.parse(sessionStorage.getItem("babder_user") || "{}");
        if (row.user_id === currentUser.id && (data.rol !== row.rol || data.aktif !== row.aktif)) throw new Error("Kendi admin rolünüzü bu ekrandan değiştiremezsiniz.");
        if (row.rol === "admin" && row.aktif && (data.rol !== "admin" || !data.aktif)) {
          const admins = await db.select("yoneticiler", "rol=eq.admin&aktif=eq.true");
          if (admins.length <= 1) throw new Error("Son aktif admin devre dışı bırakılamaz.");
        }
      }
      if (row) await db.update(cfg.table, row.id, data);
      else await db.insert(cfg.table, data);
      toastGoster("Kayıt kaydedildi.", "basari");
      await veriModulunuYukle(root, Object.keys(MODULLER).find(k => MODULLER[k] === cfg));
    } catch (error) {
      await Promise.allSettled(uploadedImages.map(file => db.removeStorageObject(file.bucket, file.objectPath)));
      toastGoster(error.message || (cfg.table === "yoneticiler" ? "Yönetici kaydedilemedi. Auth UUID’sini, benzersizliği ve son admin korumasını kontrol edin." : "Kaydedilemedi. Zorunlu alanları ve rol izinlerini kontrol edin."), "hata");
    }
  });
  root.prepend(form);
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === "") return "";
  if (type === "datetime-local") {
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }
  return value;
}

async function guncelle(root, cfg, row, data) {
  try { await db.update(cfg.table, row.id, data); toastGoster("Kayıt güncellendi.", "basari"); await veriModulunuYukle(root, Object.keys(MODULLER).find(k => MODULLER[k] === cfg)); }
  catch { toastGoster("Güncelleme başarısız.", "hata"); }
}

async function sil(root, cfg, row) {
  if (!confirm("Bu kaydı silmek istediğinizden emin misiniz?")) return;
  try {
    if (cfg.table === "yoneticiler") {
      const currentUser = JSON.parse(sessionStorage.getItem("babder_user") || "{}");
      if (row.user_id === currentUser.id) throw new Error("Kendi hesabınızı bu ekrandan silemezsiniz.");
      if (row.rol === "admin" && row.aktif) {
        const admins = await db.select("yoneticiler", "rol=eq.admin&aktif=eq.true");
        if (admins.length <= 1) throw new Error("Son aktif admin silinemez.");
      }
    }
    if (cfg.softDelete) await db.update(cfg.table, row.id, { deleted_at: new Date().toISOString() });
    else await db.delete(cfg.table, row.id);
    toastGoster("Kayıt silindi.", "basari");
    await veriModulunuYukle(root, Object.keys(MODULLER).find(k => MODULLER[k] === cfg));
  } catch { toastGoster("Silme başarısız. Bu işlem için admin rolü gerekebilir.", "hata"); }
}

async function aidatlarGoster(root, editing = null) {
  panelRehberiniGoster(document.getElementById("panel-kullanim-rehberi"), "aidatlar", true);
  root.replaceChildren(el("h2", { text: "Aidat Kayıtları" }), el("button", { class: "btn btn-ikincil", text: "Üyelere dön", onclick: () => veriModulunuYukle(root, "uyeler") }));
  let rows, members;
  try {
    [rows, members] = await Promise.all([
      db.select("aidat_kayitlari", "order=yil.desc,ay.desc"),
      db.select("uyeler", "order=ad_soyad.asc")
    ]);
  } catch {
    root.appendChild(el("p", { class: "kart", text: "Aidat verileri yüklenemedi. Admin/editor izinlerini kontrol edin." }));
    return;
  }

  const form = el("form", { class: "kart", style: "max-width:700px;margin:1rem 0;" }, [el("h3", { text: editing ? "Aidatı düzenle" : "Aidat ekle" })]);
  const member = el("select", { name: "uye_id", class: "form-denetim", required: true }, (members || []).map(m => el("option", { value: m.id, text: m.uye_no + " — " + m.ad_soyad, selected: editing?.uye_id === m.id })));
  const year = el("input", { name: "yil", type: "number", min: 2000, max: 2100, value: editing?.yil || new Date().getFullYear(), class: "form-denetim", required: true });
  const month = el("input", { name: "ay", type: "number", min: 1, max: 12, value: editing?.ay || new Date().getMonth() + 1, class: "form-denetim", required: true });
  const amount = el("input", { name: "tutar", type: "number", min: 0, step: ".01", value: editing?.tutar ?? "", class: "form-denetim", required: true });
  const paid = el("input", { name: "odendi", type: "checkbox", checked: Boolean(editing?.odendi) });
  const receipt = el("input", { name: "makbuz_no", type: "text", maxLength: 50, value: editing?.makbuz_no || "", class: "form-denetim" });
  const note = el("textarea", { name: "aciklama", maxLength: 2000, text: editing?.aciklama || "", class: "form-denetim" });
  for (const [label, node] of [["Üye", member], ["Yıl", year], ["Ay", month], ["Tutar", amount], ["Ödendi", paid], ["Makbuz numarası", receipt], ["Açıklama", note]]) {
    const grup = el("div", { class: "panel-form-alani" }, [el("label", { class: "form-grup", text: label }, [node])]);
    alanYardimiEkle(node, grup, "aidatlar", node.name, label);
    form.appendChild(grup);
  }
  form.appendChild(el("button", { class: "btn btn-ana", type: "submit", text: "Kaydet" }));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = {
      uye_id: member.value, yil: Number(year.value), ay: Number(month.value),
      tutar: Number(amount.value), odendi: paid.checked,
      odeme_tarihi: paid.checked ? editing?.odeme_tarihi || new Date().toISOString().slice(0, 10) : null,
      makbuz_no: receipt.value.trim() || null, aciklama: note.value.trim() || null
    };
    try {
      if (editing) await db.update("aidat_kayitlari", editing.id, data);
      else await db.insert("aidat_kayitlari", data);
      toastGoster("Aidat kaydedildi.", "basari");
      await aidatlarGoster(root);
    } catch {
      toastGoster("Aidat kaydedilemedi.", "hata");
    }
  });
  root.appendChild(form);

  const table = el("table", { class: "veri-tablosu" });
  const body = el("tbody");
  table.append(
    el("thead", {}, [
      el("tr", {}, ["Üye", "Dönem", "Tutar", "Durum", "İşlem"].map(text => el("th", { text })))
    ]),
    body
  );
  for (const row of rows || []) {
    const person = members?.find(m => m.id === row.uye_id);
    const actions = [
      el("button", { class: "btn btn-ikincil", text: "Düzenle", onclick: () => aidatlarGoster(root, row) }),
      el("button", { class: "btn btn-ikincil", text: row.odendi ? "Ödenmedi işaretle" : "Ödendi işaretle", onclick: async () => {
        try { await db.update("aidat_kayitlari", row.id, { odendi: !row.odendi, odeme_tarihi: row.odendi ? null : new Date().toISOString().slice(0, 10) }); await aidatlarGoster(root); }
        catch { toastGoster("Aidat durumu güncellenemedi.", "hata"); }
      } }),
      el("button", { class: "btn btn-ikincil", text: "Sil", onclick: async () => {
        if (!confirm("Aidat kaydı silinsin mi?")) return;
        try { await db.delete("aidat_kayitlari", row.id); await aidatlarGoster(root); }
        catch { toastGoster("Aidat silinemedi.", "hata"); }
      } })
    ];
    body.appendChild(el("tr", {}, [
      el("td", { text: person?.ad_soyad || "Silinmiş üye" }),
      el("td", { text: row.yil + "/" + row.ay }),
      el("td", { text: row.tutar + " ₺" }),
      el("td", { text: row.odendi ? "Ödendi" : "Bekliyor" }),
      el("td", {}, actions)
    ]));
  }
  root.appendChild(el("div", { class: "veri-tablosu-kapsayici" }, [table]));
}
async function medyaModulunuYukle(root) {
  root.replaceChildren(el("h2", { text: "Medya Kütüphanesi" }));
  root.appendChild(el("p", { class: "kart", text: "Görseller 3 MB’a kadar WebP’ye sıkıştırılır. Belgeler PDF olmalı ve 10 MB’ı geçmemelidir." }));
  const canUpload = ["admin", "editor"].includes(window.BABDER_ROLE);
  const form = el("form", { class: "kart", style: "max-width:700px;margin:1rem 0;" }, [el("h3", { text: "Dosya yükle" })]);
  const bucket = el("select", { class: "form-denetim", name: "bucket" }, [el("option", { value: "gorseller", text: "Görsel" }), el("option", { value: "belgeler", text: "PDF belge" })]);
  const file = el("input", { name: "file", class: "form-denetim", type: "file", required: true, accept: "image/jpeg,image/png,image/webp,application/pdf" });
  const alt = el("input", { name: "alt_metin", class: "form-denetim", type: "text", maxLength: 255, placeholder: "Alternatif metin (isteğe bağlı)" });
  for (const [label, field] of [["Dosya türü", bucket], ["Dosya", file], ["Alternatif metin", alt]]) {
    const grup = el("div", { class: "panel-form-alani" }, [el("label", { class: "form-grup", text: label }, [field])]);
    alanYardimiEkle(field, grup, "medya", field.name, label);
    form.appendChild(grup);
  }
  form.appendChild(el("button", { class: "btn btn-ana", type: "submit", text: "Yükle" }));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const source = file.files?.[0];
    if (!source) return;
    const image = bucket.value === "gorseller";
    const valid = image ? ["image/jpeg", "image/png", "image/webp"].includes(source.type) : source.type === "application/pdf";
    const limit = image ? 3 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!valid || source.size > limit) { toastGoster(image ? "JPEG, PNG veya WebP görseli 3 MB altında olmalı." : "Yalnızca 10 MB altı PDF yüklenebilir.", "hata"); return; }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    let objectPath;
    try {
      const user = JSON.parse(sessionStorage.getItem("babder_user") || "{}");
      if (!user.id) throw new Error("Oturum bilgisi bulunamadı.");
      const processed = image ? await gorseliWebpSikistir(source) : source;
      if (processed.size > limit) throw new Error("Sıkıştırılmış dosya sınırı aşıyor.");
      const extension = image ? "webp" : "pdf";
      objectPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const url = await db.upload(bucket.value, objectPath, processed, image ? "image/webp" : "application/pdf");
      try {
        await db.insert("medya", { dosya_adi: source.name.slice(0, 255), dosya_url: url, mime_turu: image ? "image/webp" : "application/pdf", boyut_bayt: processed.size, alt_metin: alt.value.trim() || null, yukleyen: user.id });
      } catch (error) {
        await db.removeStorageObject(bucket.value, objectPath).catch(() => {});
        throw error;
      }
      toastGoster("Dosya yüklendi.", "basari");
      await medyaModulunuYukle(root);
    } catch {
      toastGoster("Yükleme tamamlanamadı. Oturum, Storage politikaları ve dosya sınırlarını kontrol edin.", "hata");
      button.disabled = false;
    }
  });
  if (canUpload) root.appendChild(form);
  const list = el("div", { class: "izgara-3" });
  root.appendChild(list);
  try {
    const records = await db.select("medya", "order=created_at.desc");
    if (!records.length) list.appendChild(el("p", { class: "kart", text: "Henüz dosya yüklenmedi." }));
    for (const record of records) {
      const card = el("article", { class: "kart" }, [el("h3", { text: record.dosya_adi }), el("p", { text: `${record.mime_turu} • ${Math.ceil(record.boyut_bayt / 1024)} KB` }), el("a", { href: record.dosya_url, target: "_blank", rel: "noopener noreferrer", text: "Dosyayı aç" }), el("button", { class: "btn btn-ikincil", text: "URL’yi kopyala", onclick: async () => { try { await navigator.clipboard.writeText(record.dosya_url); toastGoster("Dosya URL’si kopyalandı.", "basari"); } catch { toastGoster("URL kopyalanamadı; bağlantıyı açıp adres çubuğundan kopyalayın.", "hata"); } } })]);
      if (record.mime_turu.startsWith("image/")) card.prepend(el("img", { src: record.dosya_url, alt: record.alt_metin || "", style: "width:100%;height:180px;object-fit:cover;" }));
      if (window.BABDER_ROLE === "admin") card.appendChild(el("button", { class: "btn btn-ikincil", text: "Dosyayı ve kaydı sil", onclick: async () => {
        if (!confirm("Dosya Storage’dan ve medya listesinden kalıcı olarak silinsin mi?")) return;
        try {
          const url = new URL(record.dosya_url);
          const marker = "/storage/v1/object/public/";
          const position = url.pathname.indexOf(marker);
          if (url.origin !== new URL(db.url).origin || position < 0) throw new Error("Dosya URL’si güvenilir Supabase kovasına ait değil.");
          const [bucketName, ...parts] = url.pathname.slice(position + marker.length).split("/");
          const path = parts.map(decodeURIComponent).join("/");
          await db.removeStorageObject(decodeURIComponent(bucketName), path);
          await db.delete("medya", record.id);
          toastGoster("Dosya silindi.", "basari");
          await medyaModulunuYukle(root);
        } catch { toastGoster("Dosya silinemedi. Admin yetkisini ve Storage izinlerini kontrol edin.", "hata"); }
      } }));
      list.appendChild(card);
    }
  } catch { list.appendChild(el("p", { class: "kart", text: "Medya listesi yüklenemedi. Rol ve Storage/medya izinlerini kontrol edin." })); }
}
