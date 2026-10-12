import { db } from "../api.js";

document.addEventListener("DOMContentLoaded", () => {
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
        window.location.href = "./index.html";
      } else {
        throw new Error("Oturum açılamadı.");
      }
    } catch (err) {
      console.error("Giriş hatası:", err);
      hataKutusu.textContent = err.message || "E-posta veya şifre hatalı.";
      hataKutusu.classList.remove("gizli");
      btn.disabled = false;
      btn.textContent = "Giriş Yap";
    }
  });
});
