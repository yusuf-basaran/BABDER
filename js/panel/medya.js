import { db } from "../api.js";
import { el } from "../utils.js";

export function dosyaBaglantisiniDogrula(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Dosya bağlantısı https:// ile başlamalıdır.");
  return url.href;
}

export function belgeAlaniniOlustur(url = "") {
  const urlInput = el("input", { type: "url", class: "form-denetim", value: url, "aria-label": "PDF belge bağlantısı", placeholder: "https://… (bağlantı varsa)" });
  const fileInput = el("input", { type: "file", class: "form-denetim", accept: ".pdf,application/pdf", "aria-label": "Cihazdan PDF belge seç" });
  const status = el("p", { class: "panel-alan-yardimi", role: "status", "aria-live": "polite" });
  const root = el("div", { class: "panel-dosya-secimi" }, [
    el("span", { text: "URL ile ekle" }), urlInput,
    el("span", { text: "veya cihazdan yükle" }), fileInput,
    el("p", { class: "panel-alan-yardimi", text: "PDF seçin (en fazla 10 MB) veya mevcut belgenin HTTPS bağlantısını yazın. Seçtiğiniz dosya Kaydet düğmesine bastığınızda yüklenir." }), status
  ]);
  urlInput.addEventListener("input", () => { fileInput.value = ""; status.textContent = ""; });
  fileInput.addEventListener("change", () => {
    if (fileInput.files?.[0]) { urlInput.value = ""; status.textContent = `${fileInput.files[0].name} seçildi. Kaydet ile yüklenecek.`; }
    else status.textContent = "";
  });
  return { root, urlInput, fileInput, status };
}

export async function belgeyiYukle(dosya) {
  if (!dosya || dosya.size === 0 || dosya.size > 10 * 1024 * 1024 || (dosya.type !== "application/pdf" && !(dosya.type === "" && /\.pdf$/i.test(dosya.name)))) {
    throw new Error("En fazla 10 MB boyutunda bir PDF belge seçin.");
  }
  const signature = new TextDecoder().decode(await dosya.slice(0, 5).arrayBuffer());
  if (signature !== "%PDF-") throw new Error("Seçtiğiniz dosya geçerli bir PDF belge değil.");
  const user = JSON.parse(sessionStorage.getItem("babder_user") || "{}");
  if (!user.id) throw new Error("Oturum bilgisi bulunamadı.");
  const objectPath = `${user.id}/${crypto.randomUUID()}.pdf`;
  const url = await db.upload("belgeler", objectPath, dosya, "application/pdf");
  return { url, bucket: "belgeler", objectPath };
}

export function gorselAlaniniOlustur(url = "", required = false) {
  const urlInput = el("input", { type: "url", class: "form-denetim", value: url || "", required, "aria-label": "Görsel bağlantısı (isteğe bağlı)", placeholder: "https://… (isteğe bağlı)" });
  const fileInput = el("input", { type: "file", class: "form-denetim", "aria-label": "Cihazdan görsel seç", accept: "image/jpeg,image/png,image/webp" });
  const preview = el("img", { alt: "Görsel önizlemesi", style: "display:none;max-width:220px;max-height:140px;object-fit:cover;margin-top:.5rem;border-radius:8px;" });
  const root = el("div", { class: "panel-dosya-secimi" }, [el("span", { text: "URL ile ekle" }), urlInput, el("small", { class: "soluk-metin", text: "İsterseniz URL girin veya cihazınızdan görsel seçin. Seçtiğiniz dosya yüklenince URL otomatik doldurulur." }), el("span", { text: "veya cihazdan yükle" }), fileInput, preview]);
  let objectUrl = null;
  const showPreview = source => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = source?.startsWith("blob:") ? source : null;
    preview.src = source || "";
    preview.style.display = source ? "block" : "none";
  };
  if (url) showPreview(url);
  urlInput.addEventListener("input", () => { fileInput.value = ""; showPreview(urlInput.value); });
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) showPreview(URL.createObjectURL(file));
  });
  return { root, urlInput, fileInput };
}

export async function gorseliYukle(dosya) {
  if (!dosya || !["image/jpeg", "image/png", "image/webp"].includes(dosya.type) || dosya.size > 10 * 1024 * 1024) {
    throw new Error("JPEG, PNG veya WebP formatında ve 10 MB altında bir görsel seçin.");
  }
  const user = JSON.parse(sessionStorage.getItem("babder_user") || "{}");
  if (!user.id) throw new Error("Oturum bilgisi bulunamadı.");
  const processed = await gorseliWebpSikistir(dosya);
  if (processed.size > 3 * 1024 * 1024) throw new Error("Sıkıştırılmış görsel 3 MB sınırını aşıyor.");
  const objectPath = `${user.id}/${crypto.randomUUID()}.webp`;
  const url = await db.upload("gorseller", objectPath, processed, "image/webp");
  return { url, bucket: "gorseller", objectPath };
}

export async function gorseliWebpSikistir(dosya, maksGenislik = 1600, kalite = 0.85) {
  return new Promise((resolve, reject) => {
    const okuyucu = new FileReader();
    okuyucu.onload = (e) => {
      const gorsel = new Image();
      gorsel.onload = () => {
        if (!gorsel.width || !gorsel.height || gorsel.width * gorsel.height > 40000000) {
          reject(new Error("Görsel boyutları izin verilen sınırı aşıyor."));
          return;
        }
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maksGenislik / Math.max(gorsel.width, gorsel.height));
        const genislik = Math.max(1, Math.round(gorsel.width * scale));
        const yukseklik = Math.max(1, Math.round(gorsel.height * scale));

        canvas.width = genislik;
        canvas.height = yukseklik;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Görsel işleme başlatılamadı.")); return; }
        ctx.drawImage(gorsel, 0, 0, genislik, yukseklik);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("WebP dönüştürme hatası"));
        }, "image/webp", kalite);
      };
      gorsel.onerror = () => reject(new Error("Görsel dosyası okunamadı."));
      gorsel.src = e.target.result;
    };
    okuyucu.onerror = reject;
    okuyucu.readAsDataURL(dosya);
  });
}
