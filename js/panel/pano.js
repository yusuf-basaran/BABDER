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

  try {
    const haberler = await db.select("haberler", "durum=eq.yayinda&deleted_at=is.null");
    let basvurular = [];
    let mesajlar = [];
    if (window.BABDER_ROLE !== "goruntuleyici") {
      [basvurular, mesajlar] = await Promise.all([
        db.select("uyelik_basvurulari", "deleted_at=is.null"),
        db.select("iletisim_mesajlari", "okundu=eq.false&deleted_at=is.null")
      ]);
    }
    document.getElementById("sayac-basvuru").textContent = window.BABDER_ROLE === "goruntuleyici" ? "—" : basvurular.filter(row => row.durum === "yeni").length;
    document.getElementById("sayac-mesaj").textContent = window.BABDER_ROLE === "goruntuleyici" ? "—" : mesajlar.length;
    document.getElementById("sayac-icerik").textContent = haberler.length;
    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() - 5);
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(start); d.setMonth(start.getMonth() + i); return d; });
    const counts = months.map(month => basvurular.filter(row => { const d = new Date(row.created_at); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); }).length);
    const labels = months.map(month => month.toLocaleDateString("tr-TR", { month: "short" }));
    svgGrafigiCiz(document.getElementById("svg-grafik-kapsayici"), counts, labels);
  } catch {
    document.getElementById("svg-grafik-kapsayici").textContent = "Pano verileri yüklenemedi. Veritabanı izinlerini ve bağlantıyı kontrol edin.";
    ["sayac-basvuru", "sayac-mesaj", "sayac-icerik"].forEach(id => document.getElementById(id).textContent = "—");
  }
}

function svgGrafigiCiz(hedef, veriler, etiketler) {
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

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x + cubukGenislik / 2);
    label.setAttribute("y", 147);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "11");
    label.setAttribute("fill", "#4A5A4E");
    label.textContent = etiketler?.[indis] || "";

    svg.appendChild(rect);
    svg.appendChild(text);
    svg.appendChild(label);
  });

  hedef.appendChild(svg);
}
