import { db } from "../api.js";
import { panoModulunuYukle } from "./pano.js";
import { haberModulunuYukle } from "./icerik.js";
import { basvuruModulunuYukle } from "./basvurular.js";
import { ayarlarModulunuYukle } from "./ayarlar.js";
import { guvenlikModulunuYukle } from "./guvenlik.js";
import { veriModulunuYukle } from "./veri.js";
import { temaYonetiminiBaslat } from "../tema.js";
import { mfaAkisiniGoster } from "./mfa.js";
import { panelRehberiniGoster } from "./rehber.js";

const token = sessionStorage.getItem("babder_token");
if (!token && !window.location.pathname.includes("giris.html")) {
  window.location.href = "/yonetim/giris.html";
}

document.addEventListener("DOMContentLoaded", () => {
  temaYonetiminiBaslat();
  paneliBaslat();
});

async function paneliBaslat() {
  try {
    const user = JSON.parse(sessionStorage.getItem("babder_user") || "{}");
    if (!user.id) throw new Error("Oturum bulunamadı.");
    const managers = await db.select("yoneticiler", `user_id=eq.${encodeURIComponent(user.id)}&select=rol,ad,aktif&limit=1`);
    const manager = managers[0];
    if (!manager?.aktif || !["admin", "editor", "goruntuleyici"].includes(manager.rol)) {
      throw new Error("Bu Supabase hesabı etkin BABDER yöneticisi olarak tanımlı değil. Auth kullanıcı UUID’si yoneticiler tablosunda bulunmalı ve aktif olmalı.");
    }
    window.BABDER_ROLE = manager.rol;
    const authUser = await db.authUser();
    const hasFactor = authUser.factors?.some(item => item.factor_type === "totp" && item.status === "verified");
    if ((manager.rol === "admin" || hasFactor) && db.assuranceLevel() !== "aal2") {
      window.location.href = "/yonetim/giris.html";
      return;
    }
    document.body.dataset.role = manager.rol;
    document.getElementById("yonetici-adi").textContent = manager.ad;
    erisimleriAyarla(manager.rol);
  } catch (error) {
    db.signOut(error.message || "Panel yetkisi doğrulanamadı. Supabase bağlantısını ve yönetici kaydınızı kontrol edin.");
    return;
  }
  modulYonlendir();
  komutPaletiniBaslat();
  oturumZamanAsimiDenetle();
  document.getElementById("cikis-btn")?.addEventListener("click", () => db.signOut());
  document.getElementById("mfa-kurulum-btn")?.addEventListener("click", () => {
    panelRehberiniGoster(document.getElementById("panel-kullanim-rehberi"), "mfa", true);
    mfaAkisiniGoster(document.getElementById("modul-alani"), () => window.location.reload());
  });
  const menuButton = document.getElementById("panel-menu-tetikleyici");
  const sidebar = document.getElementById("panel-kenar");
  menuButton?.addEventListener("click", () => {
    const open = sidebar.classList.toggle("acik");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  sidebar?.addEventListener("click", event => {
    if (event.target.closest("a[data-modul]")) {
      sidebar.classList.remove("acik");
      menuButton?.setAttribute("aria-expanded", "false");
    }
  });
  window.addEventListener("hashchange", modulYonlendir);
}

function erisimleriAyarla(rol) {
  const adminOnly = new Set(["ayarlar", "guvenlik", "hukuki", "surumler", "yoneticiler"]);
  const editorOnly = new Set(["basvurular", "mesajlar", "uyeler", "medya"]);
  document.querySelectorAll(".kenar-menu a[data-modul]").forEach(link => {
    const key = link.dataset.modul;
    const hidden = rol !== "admin" && adminOnly.has(key)
      || rol === "goruntuleyici" && editorOnly.has(key);
    link.closest("li").hidden = hidden;
  });
  if (document.querySelector(`.kenar-menu a[data-modul="${location.hash.slice(1)}"]`)?.closest("li").hidden) location.hash = "pano";
}

function modulYonlendir() {
  let hash = window.location.hash.replace("#", "") || "pano";
  const link = document.querySelector(`.kenar-menu a[data-modul="${CSS.escape(hash)}"]`);
  if (!link || link.closest("li").hidden) {
    window.location.hash = "pano";
    hash = "pano";
  }
  const modulAlani = document.getElementById("modul-alani");
  const baslik = document.getElementById("aktif-sayfa-baslik");
  panelRehberiniGoster(document.getElementById("panel-kullanim-rehberi"), hash, true);

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
  } else if (["duyurular", "etkinlikler", "taziyeler", "kampanyalar", "galeri", "albumler", "koyler", "mesajlar", "uyeler", "medya", "sayfalar", "sayfa_bolumleri", "anasayfa", "menu", "kurul", "belgeler", "hukuki", "surumler", "yoneticiler"].includes(hash)) {
    baslik.textContent = document.querySelector(`[data-modul="${hash}"]`)?.textContent.trim() || "Yönetim";
    veriModulunuYukle(modulAlani, hash);
  } else {
    window.location.hash = "pano";
  }
}

function komutPaletiniBaslat() {
  const palet = document.getElementById("komut-paleti");
  const input = document.getElementById("komut-input");
  const results = document.getElementById("komut-sonuclar");
  const links = [...document.querySelectorAll(".kenar-menu a[data-modul]")].filter(link => !link.closest("li").hidden);
  input.addEventListener("input", () => {
    const q = input.value.trim().toLocaleLowerCase("tr");
    results.replaceChildren(...links.filter(link => !q || link.textContent.toLocaleLowerCase("tr").includes(q)).map(link => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-ikincil";
      button.style = "display:block;width:100%;text-align:left;margin:.25rem 0;";
      button.textContent = link.textContent.trim();
      button.addEventListener("click", () => { location.hash = link.dataset.modul; palet.style.display = "none"; input.value = ""; results.replaceChildren(); });
      return button;
    }));
  });

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      palet.style.display = palet.style.display === "none" ? "flex" : "none";
      if (palet.style.display === "flex") { input.focus(); input.dispatchEvent(new Event("input")); }
    }
    if (e.key === "Escape") {
      palet.style.display = "none";
      input.value = "";
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
