import { db } from "./api.js";
import { el } from "./utils.js";

// DOM hazır olduğunda ilk olarak arayüz etkileşimlerini (menü & tema) anında bağla
document.addEventListener("DOMContentLoaded", () => {
  mobilMenuyuBaslat();
  temaYonetimiBaslat();
  cerezBanneriBaslat();

  // Ağ (Supabase) isteklerini arayüzü kilitlemeden arka planda çalıştır
  ayarlarıVeBakimiDenetle();
  menuyuYukle();
  googleSchemaOlustur();
});

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
        const li = document.createElement("li");
        const a = document.createElement("a");

        let linkHref = m.baglanti;
        if (isInPages) {
          if (linkHref === "/" || linkHref === "./" || linkHref === "index.html") {
            linkHref = "../index.html";
          } else if (linkHref.startsWith("/sayfalar/")) {
            linkHref = linkHref.replace("/sayfalar/", "./");
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
