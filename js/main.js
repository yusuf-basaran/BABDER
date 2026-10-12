import { db } from "./api.js";
import { el } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  await ayarlarıVeBakimiDenetle();
  cerezBanneriBaslat();
  temaYonetimiBaslat();
  menuyuYukle();
});

async function ayarlarıVeBakimiDenetle() {
  const ayarlar = await db.select("ayarlar", "halka_acik=eq.true");
  if (!ayarlar) return;

  const ayarHaritasi = {};
  ayarlar.forEach(a => ayarHaritasi[a.anahtar] = a.deger);

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

  document.querySelectorAll("[data-ayar]").forEach(eleman => {
    const anahtar = eleman.getAttribute("data-ayar");
    if (ayarHaritasi[anahtar]) {
      eleman.textContent = ayarHaritasi[anahtar];
    }
  });
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
      const yeniTema = document.documentElement.getAttribute("data-tema") === "koyu" ? "varsayilan" : "koyu";
      document.documentElement.setAttribute("data-tema", yeniTema);
      localStorage.setItem("babder_tema", yeniTema);
    });
  }
}

async function menuyuYukle() {
  const menuListe = document.getElementById("menu-liste");
  if (!menuListe) return;

  const veriler = await db.select("menu_ogeleri", "aktif=eq.true&konum=eq.header&order=sira.asc");
  if (veriler && veriler.length > 0) {
    const isInPages = window.location.pathname.includes("/sayfalar/");
    menuListe.innerHTML = "";
    veriler.forEach(m => {
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
}
