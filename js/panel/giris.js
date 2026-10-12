import { db } from "../api.js";
import { temaYonetiminiBaslat } from "../tema.js";
import { mfaAkisiniGoster } from "./mfa.js";

document.addEventListener("DOMContentLoaded", () => {
  temaYonetiminiBaslat();
  const form = document.getElementById("giris-formu");
  const btn = document.getElementById("giris-btn");
  const hataKutusu = document.getElementById("giris-hata");

  if (!form) return;

  const oncekiHata = sessionStorage.getItem("babder_login_error");
  if (oncekiHata) {
    hataKutusu.textContent = oncekiHata;
    hataKutusu.classList.remove("gizli");
    sessionStorage.removeItem("babder_login_error");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    hataKutusu.textContent = "";
    hataKutusu.classList.add("gizli");
    btn.disabled = true;
    btn.textContent = "Giriş yapılıyor...";

    const email = document.getElementById("eposta").value.trim();
    const sifre = document.getElementById("sifre").value;

    try {
      const res = await db.signIn(email, sifre);
      if (res && res.access_token) {
        const [manager] = await db.select("yoneticiler", `user_id=eq.${encodeURIComponent(res.user.id)}&select=rol,aktif&limit=1`);
        if (!manager?.aktif) throw new Error("Bu hesabın etkin yönetici kaydı bulunmuyor.");
        const authUser = await db.authUser();
        const hasFactor = authUser.factors?.some(item => item.factor_type === "totp" && item.status === "verified");
        if (manager.rol === "admin" || hasFactor) {
          form.hidden = true;
          const root = document.createElement("div"); root.dataset.mfa = "true"; form.after(root);
          await mfaAkisiniGoster(root, () => { window.location.href = "./index.html"; });
        } else window.location.href = "./index.html";
      } else {
        throw new Error("Oturum açılamadı.");
      }
    } catch (err) {
      form.hidden = false;
      form.parentElement.querySelector('[data-mfa="true"]')?.remove();
      console.error("Giriş hatası:", err);
      hataKutusu.textContent = err.message || "E-posta veya şifre hatalı.";
      hataKutusu.classList.remove("gizli");
      btn.disabled = false;
      btn.textContent = "Giriş Yap";
    }
  });
});
