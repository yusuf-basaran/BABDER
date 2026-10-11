export async function gorseliWebpSikistir(dosya, maksGenislik = 1600, kalite = 0.82) {
  return new Promise((resolve, reject) => {
    const okuyucu = new FileReader();
    okuyucu.onload = (e) => {
      const gorsel = new Image();
      gorsel.onload = () => {
        const canvas = document.createElement("canvas");
        let genislik = gorsel.width;
        let yukseklik = gorsel.height;

        if (genislik > maksGenislik) {
          yukseklik = Math.round((yukseklik * maksGenislik) / genislik);
          genislik = maksGenislik;
        }

        canvas.width = genislik;
        canvas.height = yukseklik;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(gorsel, 0, 0, genislik, yukseklik);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("WebP dönüştürme hatası"));
        }, "image/webp", kalite);
      };
      gorsel.src = e.target.result;
    };
    okuyucu.onerror = reject;
    okuyucu.readAsDataURL(dosya);
  });
}
