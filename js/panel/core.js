import { db } from "../api.js";
import { panoModulunuYukle } from "./pano.js";
import { haberModulunuYukle } from "./icerik.js";
import { basvuruModulunuYukle } from "./basvurular.js";
import { ayarlarModulunuYukle } from "./ayarlar.js";
import { guvenlikModulunuYukle } from "./guvenlik.js";

const token = localStorage.getItem("babder_token");
if (!token && !window.location.pathname.includes("giris.html")) {
  window.location.href = "/yonetim/giris.html";
}

document.addEventListener("DOMContentLoaded", () => {
  modulYonlendir();
  komutPaletiniBaslat();
  oturumZamanAsimiDenetle();

  document.getElementById("cikis-btn")?.addEventListener("click", () => db.signOut());
  window.addEventListener("hashchange", modulYonlendir);
});

function modulYonlendir() {
  const hash = window.location.hash.replace("#", "") || "pano";
  const modulAlani = document.getElementById("modul-alani");
  const baslik = document.getElementById("aktif-sayfa-baslik");

  document.querySelectorAll(".kenar-menu a").forEach(link => {
    link.classList.toggle("aktif", link.getAttribute("data-modul") === hash);
  });

  if (hash === "pano") {
    baslik.textContent = "Yönetim Panosu";
    panoModulunuYukle(modulAlani);
  } else if (hash === "haberler") {
    baslik.textContent = "Haber Yönetimi";
    haberModulunuYukle(modulAlani);
  } else if (hash === "basvurular") {
    baslik.textContent = "Üyelik Başvuruları";
    basvuruModulunuYukle(modulAlani);
  } else if (hash === "ayarlar") {
    baslik.textContent = "Site & Sistem Ayarları";
    ayarlarModulunuYukle(modulAlani);
  } else if (hash === "guvenlik") {
    baslik.textContent = "Güvenlik & Denetim";
    guvenlikModulunuYukle(modulAlani);
  } else {
    modulAlani.textContent = "[İÇERİK EKLENECEK: Bu modül hazırlanmaktadır.]";
  }
}

function komutPaletiniBaslat() {
  const palet = document.getElementById("komut-paleti");
  const input = document.getElementById("komut-input");

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      palet.style.display = palet.style.display === "none" ? "flex" : "none";
      if (palet.style.display === "flex") input.focus();
    }
    if (e.key === "Escape") {
      palet.style.display = "none";
    }
  });
}

function oturumZamanAsimiDenetle() {
  let sonAktivite = Date.now();
  const zamanAsimiSuresi = 30 * 60 * 1000;

  ["click", "keydown", "mousemove"].forEach(olay => {
    window.addEventListener(olay, () => sonAktivite = Date.now());
  });

  setInterval(() => {
    if (Date.now() - sonAktivite > zamanAsimiSuresi) {
      alert("Oturumunuz boşta kalma nedeniyle kapatıldı.");
      db.signOut();
    }
  }, 60000);
}
