import { formGuvenliginiBaslat, guvenliFormGonder } from "./form-guvenligi.js";
formGuvenliginiBaslat();

function formSonucunuGoster(hedef, mesaj, hata = false) {
  if (!hedef) return;
  hedef.textContent = mesaj;
  hedef.setAttribute("role", hata ? "alert" : "status");
  hedef.setAttribute("aria-live", hata ? "assertive" : "polite");
}

document.getElementById("iletisim-formu")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const sonuc = document.getElementById("mesaj-durum");
  if (document.getElementById("guvenlik_kodu")?.value) {
    formSonucunuGoster(sonuc, "Hatalı işlem tespit edildi.", true);
    return;
  }
  const veri = {
    ad_soyad: document.getElementById("iletisim_ad").value.trim(),
    eposta: document.getElementById("iletisim_eposta").value.trim().toLocaleLowerCase("en-US"),
    konu: document.getElementById("iletisim_konu").value.trim(),
    mesaj: document.getElementById("iletisim_mesaj").value.trim(),
    kvkk_onay: document.getElementById("iletisim_kvkk").checked
  };
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    await guvenliFormGonder("iletisim", veri, form);
    formSonucunuGoster(sonuc, "Mesajınız iletildi.");
    form.reset();
  } catch (error) {
    formSonucunuGoster(sonuc, error.message || "Mesaj iletilemedi. Lütfen daha sonra yeniden deneyin.", true);
  } finally {
    submit.disabled = false;
  }
});

document.getElementById("uyelik-formu")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const sonuc = document.getElementById("form-sonuc");
  if (document.getElementById("websitesi_referans")?.value) {
    formSonucunuGoster(sonuc, "Hatalı işlem tespit edildi.", true);
    return;
  }
  const veri = {
    ad_soyad: document.getElementById("ad_soyad").value.trim(),
    telefon: document.getElementById("telefon").value.trim(),
    eposta: document.getElementById("eposta").value.trim().toLocaleLowerCase("en-US"),
    koy_bagi: document.getElementById("koy_bagi").value.trim(),
    mesaj: document.getElementById("mesaj").value.trim(),
    kvkk_onay: document.getElementById("kvkk_onay").checked
  };
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    await guvenliFormGonder("uyelik", veri, form);
    formSonucunuGoster(sonuc, "Başvurunuz başarıyla iletildi. Yönetim kurulumuz sizinle irtibata geçecektir.");
    form.reset();
  } catch (error) {
    formSonucunuGoster(sonuc, error.message || "Başvuru iletilemedi. Lütfen bilgilerinizi kontrol edip yeniden deneyin.", true);
  } finally {
    submit.disabled = false;
  }
});

const ibanInput = document.getElementById("iban-kutusu");
const ibanButton = document.getElementById("iban-kopyala-btn");
const ibanStatus = document.getElementById("kopyalandi-bildirim");

function ibanKopyalamayiHazirla() {
  if (!ibanInput || !ibanButton) return;
  const value = ibanInput.value.trim();
  const valid = value && value !== "[IBAN]" && value !== "Yükleniyor…";
  ibanButton.disabled = !valid;
  if (!valid && ibanStatus) {
    ibanStatus.textContent = "IBAN bilgisi yakında paylaşılacaktır.";
    ibanStatus.classList.remove("gizli", "toast-basari");
    ibanStatus.setAttribute("role", "status");
    ibanStatus.setAttribute("aria-live", "polite");
  } else if (ibanStatus) {
    ibanStatus.textContent = "IBAN panoya kopyalandı!";
    ibanStatus.classList.add("gizli");
    ibanStatus.classList.add("toast-basari");
  }
}

if (ibanInput && ibanButton) {
  ibanButton.disabled = true;
  document.addEventListener("babder:ayarlar-yuklendi", ibanKopyalamayiHazirla);
  ibanKopyalamayiHazirla();
  ibanButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(ibanInput.value.trim());
      formSonucunuGoster(ibanStatus, "IBAN panoya kopyalandı!");
      ibanStatus.classList.remove("gizli");
      setTimeout(() => ibanStatus.classList.add("gizli"), 3000);
    } catch {
      formSonucunuGoster(ibanStatus, "IBAN kopyalanamadı. Alanı seçip elle kopyalayabilirsiniz.", true);
      ibanStatus.classList.remove("gizli");
    }
  });
}
