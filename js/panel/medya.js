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
