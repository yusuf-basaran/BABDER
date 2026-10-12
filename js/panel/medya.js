import { db } from "../api.js";
import { el } from "../utils.js";

export function gorselAlaniniOlustur(url = "", required = false) {
  const urlInput = el("input", { type: "url", class: "form-denetim", value: url || "", required, placeholder: "https://… (isteğe bağlı)" });
  const fileInput = el("input", { type: "file", class: "form-denetim", accept: "image/jpeg,image/png,image/webp" });
  const preview = el("img", { alt: "Görsel önizlemesi", style: "display:none;max-width:220px;max-height:140px;object-fit:cover;margin-top:.5rem;border-radius:8px;" });
  const root = el("div", {}, [urlInput, el("small", { class: "soluk-metin", text: "İsterseniz URL girin veya cihazınızdan görsel seçin. Seçtiğiniz dosya yüklenince URL otomatik doldurulur." }), fileInput, preview]);
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

export async function gorseliWebpSikistir(dosya, maksGenislik = 1600, kalite = 0.82) {
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
