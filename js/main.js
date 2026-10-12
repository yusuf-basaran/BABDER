import { db } from "./api.js";
import { el, guvenliMetinAyristir } from "./utils.js";

// DOM hazır olduğunda ilk olarak arayüz etkileşimlerini (menü & tema) anında bağla
document.addEventListener("DOMContentLoaded", () => {
  mobilMenuyuBaslat();
  temaYonetimiBaslat();
  cerezBanneriBaslat();

  // Ağ (Supabase) isteklerini arayüzü kilitlemeden arka planda çalıştır
  ayarlarıVeBakimiDenetle();
  menuyuYukle();
  publicIcerikleriYukle();
  googleSchemaOlustur();
});

async function publicIcerikleriYukle() {
  const tasks = [];
  if (document.getElementById("son-haberler-izgara") || document.getElementById("haber-listesi")) tasks.push(haberleriYukle());
  if (document.getElementById("etkinlikler-izgara") || document.getElementById("etkinlik-listesi")) tasks.push(etkinlikleriYukle());
  if (document.getElementById("duyuru-bandi")) tasks.push(duyurulariYukle());
  if (document.getElementById("anasayfa-dinamik-bolumler")) tasks.push(anasayfaBolumleriniYukle());
  if (document.getElementById("galeri-listesi")) tasks.push(galeriyiYukle());
  if (document.getElementById("koy-listesi")) tasks.push(koyleriYukle());
  if (document.getElementById("kurul-listesi")) tasks.push(kuruluYukle());
  if (document.getElementById("belge-listesi")) tasks.push(belgeleriYukle());
  if (document.getElementById("hukuki-metin")) tasks.push(hukukiMetniYukle());
  if (document.getElementById("cms-sayfa-bolumleri") || location.pathname.endsWith("/sayfa.html")) tasks.push(cmsSayfasiniYukle());
  await Promise.allSettled(tasks);
}

async function publicKayitlariGetir(tablo, filtre) {
  try { return await db.select(tablo, filtre); }
  catch (error) { console.warn(`${tablo} içeriği yüklenemedi:`, error); return null; }
}

function icerikYok(kapsayici, mesaj) {
  kapsayici.replaceChildren(el("p", { class: "soluk-metin", text: mesaj }));
}

function tarihMetni(value, options = {}) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("tr-TR", options);
}

function guvenliUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function icerikKarti({ title, text, href, image, meta, linkText = "Devamını oku" }) {
  const card = el("article", { class: "kart" });
  const imageUrl = guvenliUrl(image);
  if (imageUrl) card.appendChild(el("img", { src: imageUrl, alt: title || "", class: "kart-gorsel", loading: "lazy" }));
  if (meta) card.appendChild(el("p", { class: "soluk-metin", text: meta }));
  const heading = el("h3", { text: title || "İçerik" });
  if (href) heading.replaceChildren(el("a", { href, text: title || "İçerik" }));
  card.appendChild(heading);
  if (text) {
    const body = el("div", { class: "kart-icerik" });
    body.appendChild(guvenliMetinAyristir(text));
    card.appendChild(body);
  }
  if (href) card.appendChild(el("a", { class: "btn btn-ikincil", href, text: linkText }));
  return card;
}

async function haberleriYukle() {
  const home = document.getElementById("son-haberler-izgara");
  const page = document.getElementById("haber-listesi");
  const hedefler = [home, page].filter(Boolean);
  const rows = await publicKayitlariGetir("haberler", "durum=eq.yayinda&deleted_at=is.null&order=yayin_tarihi.desc&limit=20");
  if (!rows) { hedefler.forEach(el => icerikYok(el, "Haberler şu anda yüklenemiyor.")); return; }
  const gosterilecek = rows.filter(row => !row.yayin_tarihi || new Date(row.yayin_tarihi) <= new Date());
  for (const hedef of hedefler) {
    const liste = hedef === home ? gosterilecek.slice(0, 3) : gosterilecek;
    if (!liste.length) { icerikYok(hedef, "Henüz yayınlanmış haber bulunmuyor."); continue; }
    hedef.replaceChildren(...liste.map(row => icerikKarti({
      title: row.baslik,
      text: row.ozet,
      href: `${window.location.pathname.includes("/sayfalar/") ? "./haber-detay.html" : "./sayfalar/haber-detay.html"}?slug=${encodeURIComponent(row.slug)}`,
      image: row.kapak_gorseli,
      meta: [tarihMetni(row.yayin_tarihi), row.kategori].filter(Boolean).join(" · ")
    })));
  }
}

async function etkinlikleriYukle() {
  const home = document.getElementById("etkinlikler-izgara");
  const page = document.getElementById("etkinlik-listesi");
  const hedefler = [home, page].filter(Boolean);
  const rows = await publicKayitlariGetir("etkinlikler", "durum=eq.yayinda&deleted_at=is.null&order=baslangic_tarihi.asc&limit=50");
  if (!rows) { hedefler.forEach(el => icerikYok(el, "Etkinlikler şu anda yüklenemiyor.")); return; }
  const now = Date.now();
  const current = rows.filter(row => !row.baslangic_tarihi || new Date(row.baslangic_tarihi).getTime() >= now);
  for (const hedef of hedefler) {
    const liste = hedef === home ? current.slice(0, 3) : current;
    if (!liste.length) { icerikYok(hedef, "Şu anda yaklaşan etkinlik bulunmuyor."); continue; }
    hedef.replaceChildren(...liste.map(row => icerikKarti({
      title: row.baslik,
      text: row.aciklama,
      image: row.gorsel_url,
      meta: [tarihMetni(row.baslangic_tarihi, { dateStyle: "medium", timeStyle: "short" }), row.konum].filter(Boolean).join(" · ")
    })));
  }
}

async function duyurulariYukle() {
  const band = document.getElementById("duyuru-bandi");
  const rows = await publicKayitlariGetir("duyurular", "durum=eq.yayinda&deleted_at=is.null&order=sabit.desc,yayin_tarihi.desc&limit=20");
  if (!rows) return;
  const now = Date.now();
  const active = rows.filter(row => (!row.yayin_tarihi || new Date(row.yayin_tarihi).getTime() <= now)
    && (!row.bitis_tarihi || new Date(row.bitis_tarihi).getTime() >= now)
    && (row.bantta_goster || row.sabit));
  if (!active.length) return;
  band.replaceChildren(...active.slice(0, 3).map(row => el("p", { text: `${row.baslik}: ${row.icerik}` })));
  band.classList.remove("gizli");
}

async function anasayfaBolumleriniYukle() {
  const root = document.getElementById("anasayfa-dinamik-bolumler");
  const heroTitle = document.getElementById("hero-baslik");
  const heroSubtitle = document.getElementById("hero-alt-baslik");
  const rows = await publicKayitlariGetir("anasayfa_bolumleri", "aktif=eq.true&order=sira.asc");
  if (!rows) { icerikYok(root, "Ana sayfa içerikleri şu anda yüklenemiyor."); return; }
  const hero = rows.find(row => ["hero", "hero_alani", "ana_hero", "anasayfa_hero"].includes(String(row.kod).toLocaleLowerCase("tr")));
  if (hero) {
    if (heroTitle && hero.baslik) heroTitle.textContent = hero.baslik;
    if (heroSubtitle) heroSubtitle.textContent = hero.alt_baslik || hero.icerik || "";
    const heroImage = guvenliUrl(hero.gorsel_url);
    if (heroImage) document.querySelector(".hero-alani")?.style.setProperty("background-image", `linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.18)), url("${heroImage}")`);
  }
  const sections = rows.filter(row => row !== hero);
  if (!sections.length) { root.replaceChildren(); return; }
  root.replaceChildren(...sections.map(row => {
    const section = el("section", { class: "kapsayici bolum-bosluk-buyuk" });
    section.appendChild(icerikKarti({ title: row.baslik, text: [row.alt_baslik, row.icerik].filter(Boolean).join("\n\n"), image: row.gorsel_url }));
    const buttonUrl = guvenliUrl(row.buton_baglanti);
    if (row.buton_metin && buttonUrl) section.appendChild(el("a", { class: "btn btn-ana", href: buttonUrl, text: row.buton_metin }));
    return section;
  }));
}

async function galeriyiYukle() {
  const root = document.getElementById("galeri-listesi");
  const [photos, albums] = await Promise.all([
    publicKayitlariGetir("galeri", "deleted_at=is.null&order=sira.asc,created_at.desc&limit=100"),
    publicKayitlariGetir("albumler", "deleted_at=is.null&order=sira.asc,baslik.asc")
  ]);
  if (!photos || !albums) { icerikYok(root, "Galeri şu anda yüklenemiyor."); return; }
  const albumCards = albums.filter(album => album.kapak_gorseli).map(album => icerikKarti({ title: album.baslik, text: album.aciklama, image: album.kapak_gorseli }));
  const photoCards = photos.map(photo => icerikKarti({ title: photo.alt_metin, image: photo.gorsel_url, meta: albums.find(album => album.id === photo.album_id)?.baslik || "Fotoğraf" }));
  const cards = [...albumCards, ...photoCards];
  if (!cards.length) { icerikYok(root, "Henüz yayınlanmış fotoğraf veya albüm bulunmuyor."); return; }
  root.replaceChildren(...cards);
}

async function koyleriYukle() {
  const root = document.getElementById("koy-listesi");
  const rows = await publicKayitlariGetir("koyler", "deleted_at=is.null&order=sira.asc,ad.asc");
  if (!rows) return;
  if (!rows.length) return; // Keep the built-in Kapıkaya description as a fallback.
  root.replaceChildren(...rows.map(row => icerikKarti({ title: row.ad, text: [row.kisa_tanitim, row.detay_bilgi].filter(Boolean).join("\n\n"), image: row.kapak_gorseli })));
}

async function kuruluYukle() {
  const root = document.getElementById("kurul-listesi");
  const rows = await publicKayitlariGetir("yonetim_kurulu", "deleted_at=is.null&order=sira.asc,ad_soyad.asc");
  if (!rows) { icerikYok(root, "Yönetim kurulu şu anda yüklenemiyor."); return; }
  if (!rows.length) { icerikYok(root, "Yönetim kurulu üyeleri henüz eklenmemiş."); return; }
  root.replaceChildren(...rows.map(row => icerikKarti({ title: row.ad_soyad, text: row.gorev, image: row.fotograf_url, meta: [row.kurul_turu, row.donem].filter(Boolean).join(" · ") })));
}

async function belgeleriYukle() {
  const root = document.getElementById("belge-listesi");
  const rows = await publicKayitlariGetir("belgeler", "durum=eq.yayinda&deleted_at=is.null&order=created_at.desc");
  if (!rows) { icerikYok(root, "Belgeler şu anda yüklenemiyor."); return; }
  if (!rows.length) { icerikYok(root, "Henüz yayınlanmış belge bulunmuyor."); return; }
  root.replaceChildren(...rows.map(row => {
    const card = icerikKarti({ title: row.baslik, text: `${row.kategori} · ${row.surum}` });
    const url = guvenliUrl(row.dosya_url);
    if (url) card.appendChild(el("a", { class: "btn btn-ana", href: url, target: "_blank", rel: "noopener noreferrer", text: "Belgeyi aç" }));
    return card;
  }));
}

async function hukukiMetniYukle() {
  const root = document.getElementById("hukuki-metin");
  const code = root.dataset.kod;
  const rows = await publicKayitlariGetir("hukuki_metinler", `kod=eq.${encodeURIComponent(code)}&aktif=eq.true&limit=1`);
  if (!rows?.length) return;
  const text = el("div", { class: "kart" });
  text.appendChild(el("h2", { text: rows[0].baslik }));
  text.appendChild(guvenliMetinAyristir(rows[0].icerik));
  root.replaceChildren(text);
}

async function cmsSayfasiniYukle() {
  const params = new URLSearchParams(location.search);
  const customSlug = params.get("slug");
  const targetSlug = customSlug || location.pathname.split("/").pop().replace(/\.html?$/i, "");
  if (!targetSlug || targetSlug === "sayfa") return;
  const pages = await publicKayitlariGetir("sayfalar", `slug=eq.${encodeURIComponent(targetSlug)}&durum=eq.yayinda&deleted_at=is.null&limit=1`);
  if (!pages?.length) return;
  const page = pages[0];
  document.title = `${page.baslik} | BABDER`;
  const main = document.getElementById("ana-icerik");
  const heading = main?.querySelector("h1");
  if (heading) heading.textContent = page.baslik;
  let root = document.getElementById("cms-sayfa-bolumleri");
  if (!root) {
    root = el("section", { id: "cms-sayfa-bolumleri", class: "bolum-bosluk" });
    heading?.after(root);
  }
  const rows = await publicKayitlariGetir("sayfa_bolumleri", `sayfa_id=eq.${encodeURIComponent(page.id)}&order=sira.asc`);
  if (!rows) { icerikYok(root, "Sayfa içeriği şu anda yüklenemiyor."); return; }
  if (!rows.length) { icerikYok(root, "Bu sayfaya henüz içerik eklenmemiş."); return; }
  root.replaceChildren(...rows.map(row => {
    const section = el("section", { class: "kart" });
    if (row.baslik) section.appendChild(el("h2", { text: row.baslik }));
    section.appendChild(guvenliMetinAyristir(row.icerik));
    return section;
  }));
}

function mobilMenuyuBaslat() {
  const tetikleyici = document.getElementById("mobil-menu-tetikleyici");
  const navigasyon = document.getElementById("ana-navigasyon");

  if (!tetikleyici || !navigasyon) return;

  // Tıklama olayını doğrudan bağla
  tetikleyici.addEventListener("click", (e) => {
    e.stopPropagation();
    const acikMi = navigasyon.classList.toggle("acik");
    tetikleyici.setAttribute("aria-expanded", acikMi ? "true" : "false");
  });

  // Sayfanın boş bir yerine tıklandığında menüyü kapat
  document.addEventListener("click", (e) => {
    if (!navigasyon.contains(e.target) && !tetikleyici.contains(e.target)) {
      navigasyon.classList.remove("acik");
      tetikleyici.setAttribute("aria-expanded", "false");
    }
  });

  // Menü içindeki bir linke tıklandığında menüyü kapat
  navigasyon.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigasyon.classList.remove("acik");
      tetikleyici.setAttribute("aria-expanded", "false");
    });
  });
}

async function ayarlarıVeBakimiDenetle() {
  try {
    const ayarlar = await db.select("ayarlar", "halka_acik=eq.true");
    if (!ayarlar) return;

    const ayarHaritasi = {};
    ayarlar.forEach((a) => (ayarHaritasi[a.anahtar] = a.deger));

    const isInPages = window.location.pathname.includes("/sayfalar/");
    const isInAdmin = window.location.pathname.includes("/yonetim/");

    if (ayarHaritasi.bakim_modu === "true" && !isInAdmin) {
      if (!window.location.pathname.includes("bakim.html")) {
        window.location.href = isInPages ? "../bakim.html" : "./bakim.html";
      }
    }

    const duyuruBandi = document.getElementById("duyuru-bandi");
    if (duyuruBandi && ayarHaritasi.duyuru_bandi_aktif === "true") {
      duyuruBandi.textContent = ayarHaritasi.duyuru_bandi_metin || "";
      duyuruBandi.classList.remove("gizli");
    }

    document.querySelectorAll("[data-ayar]").forEach((eleman) => {
      const anahtar = eleman.getAttribute("data-ayar");
      if (ayarHaritasi[anahtar]) {
        eleman.textContent = ayarHaritasi[anahtar];
      }
    });
  } catch (err) {
    console.warn("Ayarlar yüklenirken hata oluştu:", err);
  }
}

function cerezBanneriBaslat() {
  const onay = localStorage.getItem("babder_cerez_tercihi");
  const banner = document.getElementById("cerez-banner");
  if (!onay && banner) {
    banner.classList.remove("gizli");

    document.getElementById("cerez-kabul")?.addEventListener("click", () => {
      localStorage.setItem("babder_cerez_tercihi", "kabul");
      banner.classList.add("gizli");
    });

    document.getElementById("cerez-reddet")?.addEventListener("click", () => {
      localStorage.setItem("babder_cerez_tercihi", "red");
      banner.classList.add("gizli");
    });
  }
}

function temaYonetimiBaslat() {
  const tema = localStorage.getItem("babder_tema") || "varsayilan";
  document.documentElement.setAttribute("data-tema", tema);

  const temaSecici = document.getElementById("tema-degistirici");
  if (temaSecici) {
    temaSecici.addEventListener("click", () => {
      const yeniTema =
        document.documentElement.getAttribute("data-tema") === "koyu"
          ? "varsayilan"
          : "koyu";
      document.documentElement.setAttribute("data-tema", yeniTema);
      localStorage.setItem("babder_tema", yeniTema);
    });
  }
}

async function menuyuYukle() {
  try {
    const menuListe = document.getElementById("menu-liste");
    if (!menuListe) return;

    const veriler = await db.select(
      "menu_ogeleri",
      "aktif=eq.true&konum=eq.header&order=sira.asc"
    );
    if (veriler && veriler.length > 0) {
      const isInPages = window.location.pathname.includes("/sayfalar/");
      menuListe.innerHTML = "";
      veriler.forEach((m) => {
        let parsedHref;
        try { parsedHref = new URL(m.baglanti, window.location.origin); } catch { return; }
        if (!["http:", "https:"].includes(parsedHref.protocol)) return;
        const li = document.createElement("li");
        const a = document.createElement("a");

        let linkHref = m.baglanti.trim();
        if (isInPages) {
          if (linkHref === "/" || linkHref === "./" || linkHref === "index.html") {
            linkHref = "../index.html";
          } else if (linkHref.startsWith("/sayfalar/")) {
            linkHref = linkHref.replace("/sayfalar/", "./");
          } else if (!linkHref.startsWith("/") && !/^https?:\/\//i.test(linkHref)) {
            linkHref = `../${linkHref}`;
          }
        }

        a.href = linkHref;
        a.textContent = m.baslik;
        li.appendChild(a);
        menuListe.appendChild(li);
      });
    }
  } catch (err) {
    console.warn("Dinamik menü yüklenemedi:", err);
  }
}

function googleSchemaOlustur() {
  const schemaVerisi = {
    "@context": "https://schema.org",
    "@type": "NonProfitOrganization",
    name: "Şanlıurfa Siverek Kapıkaya Bab Köyü ve Köyleri Sosyal Yardımlaşma ve Dayanışma Derneği",
    alternateName: "BABDER",
    url: window.location.origin,
    logo: `${window.location.origin}/img/logo.png`,
    description:
      "Şanlıurfa Siverek Kapıkaya Bab Köyü ve çevre köylerinin sosyal yardımlaşma ve dayanışma derneği resmi web sitesi.",
    foundingDate: "2019",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Siverek",
      addressRegion: "Şanlıurfa",
      addressCountry: "TR"
    },
    sameAs: ["https://www.facebook.com/share/1DsdbdzV3n/"]
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schemaVerisi);
  document.head.appendChild(script);
}
