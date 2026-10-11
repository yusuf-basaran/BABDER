import { db } from "../api.js";
import { el } from "../utils.js";

export async function panoModulunuYukle(kapsayici) {
  kapsayici.innerHTML = "";

  const kartlarAlani = el("div", { class: "izgara-3" });
  kartlarAlani.appendChild(el("div", { class: "kart" }, [
    el("h3", { text: "Bekleyen Başvurular" }),
    el("p", { text: "Yükleniyor...", id: "sayac-basvuru", style: "font-size: 2rem; font-weight: 800; color: var(--renk-ana);" })
  ]));
  kartlarAlani.appendChild(el("div", { class: "kart" }, [
    el("h3", { text: "Okunmamış Mesajlar" }),
    el("p", { text: "Yükleniyor...", id: "sayac-mesaj", style: "font-size: 2rem; font-weight: 800; color: var(--renk-ikincil);" })
  ]));
  kartlarAlani.appendChild(el("div", { class: "kart" }, [
    el("h3", { text: "Yayındaki İçerikler" }),
    el("p", { text: "Yükleniyor...", id: "sayac-icerik", style: "font-size: 2rem; font-weight: 800; color: var(--renk-vurgu-koyu);" })
  ]));
  kapsayici.appendChild(kartlarAlani);

  const grafikKarti = el("div", { class: "kart", style: "margin-top: 2rem;" }, [
    el("h3", { text: "Aylık Başvuru Dağılımı (Trend)" }),
    el("div", { id: "svg-grafik-kapsayici", style: "margin-top: 1rem;" })
  ]);
  kapsayici.appendChild(grafikKarti);

  const basvurular = await db.select("uyelik_basvurulari", "durum=eq.yeni");
  const mesajlar = await db.select("iletisim_mesajlari", "okundu=eq.false");
  const haberler = await db.select("haberler", "durum=eq.yayinda");

  document.getElementById("sayac-basvuru").textContent = basvurular ? basvurular.length : "0";
  document.getElementById("sayac-mesaj").textContent = mesajlar ? mesajlar.length : "0";
  document.getElementById("sayac-icerik").textContent = haberler ? haberler.length : "0";

  svgGrafigiCiz(document.getElementById("svg-grafik-kapsayici"), [4, 8, 15, 12, 22, 18]);
}

function svgGrafigiCiz(hedef, veriler) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 500 150");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "150");

  const maks = Math.max(...veriler, 1);
  const cubukGenislik = 40;
  const bosluk = 35;

  veriler.forEach((deger, indis) => {
    const x = indis * (cubukGenislik + bosluk) + 30;
    const yukseklik = (deger / maks) * 110;
    const y = 130 - yukseklik;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", cubukGenislik);
    rect.setAttribute("height", yukseklik);
    rect.setAttribute("fill", "#1B7F3B");
    rect.setAttribute("rx", "4");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x + cubukGenislik / 2);
    text.setAttribute("y", y - 6);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "12");
    text.setAttribute("fill", "#4A5A4E");
    text.textContent = deger;

    svg.appendChild(rect);
    svg.appendChild(text);
  });

  hedef.appendChild(svg);
}
