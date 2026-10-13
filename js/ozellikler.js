import { iskeletleYukle } from "./iskelet.js";
import { db } from "./api.js";
import { el, guvenliMetinAyristir } from "./utils.js";

export async function ekIcerikleriYukle() {
  await Promise.allSettled([iskeletleYukle("[data-taziyeler]", taziyeleriYukle, "metin"), iskeletleYukle("#kampanya-listesi, #faaliyet-raporlari", kampanyalariYukle)]);
}

async function taziyeleriYukle() {
  const roots = [...document.querySelectorAll("[data-taziyeler]")];
  if (!roots.length) return;
  try {
    const rows = await db.select("taziyeler", "durum=eq.yayinda&aile_izni=eq.true&deleted_at=is.null&order=yayin_tarihi.desc&limit=100");
    const now = Date.now();
    const active = rows.filter(row => new Date(row.yayin_tarihi).getTime() <= now && (!row.bitis_tarihi || new Date(row.bitis_tarihi).getTime() >= now));
    for (const root of roots) {
      const list = root.dataset.taziyeler === "ana" ? active.slice(0, 3) : active;
      root.replaceChildren(...list.map(row => {
        const card = el("article", { class: "kart" }, [el("h3", { text: row.ad_soyad }), el("p", { class: "soluk-metin", text: row.koy })]);
        card.appendChild(guvenliMetinAyristir(row.aciklama));
        card.appendChild(el("p", { text: `${row.cenaze_yeri} · ${new Date(row.cenaze_tarihi).toLocaleString("tr-TR")}` }));
        return card;
      }));
      if (!list.length) root.appendChild(el("p", { text: "Şu anda yayımlanmış taziye duyurusu bulunmuyor." }));
    }
  } catch { roots.forEach(root => root.replaceChildren(el("p", { role: "status", text: "Taziye duyuruları şu anda yüklenemiyor." }))); }
}

async function kampanyalariYukle() {
  const root = document.getElementById("kampanya-listesi");
  if (!root) return;
  try {
    const rows = await db.select("kampanyalar", "durum=eq.yayinda&deleted_at=is.null&order=created_at.desc");
    root.replaceChildren(...rows.map(row => {
      const target = Number(row.hedef_tutar), raised = Number(row.toplanan_tutar);
      const format = value => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
      const card = el("article", { class: "kart" }, [el("h3", { text: row.baslik })]);
      card.appendChild(guvenliMetinAyristir(row.aciklama));
      if (row.gorsel_url) {
        try { const url = new URL(row.gorsel_url); if (url.protocol === "https:") card.prepend(el("img", { src: url.href, alt: row.baslik, class: "kart-gorsel", loading: "lazy" })); } catch {}
      }
      card.append(el("progress", { max: target, value: Math.min(raised, target), "aria-label": `${row.baslik} bağış ilerlemesi` }), el("p", { text: `${format(raised)} / ${format(target)}` }));
      if (row.bitis_tarihi) card.appendChild(el("p", { text: `Bitiş: ${new Date(row.bitis_tarihi).toLocaleDateString("tr-TR")}` }));
      return card;
    }));
    if (!rows.length) root.appendChild(el("p", { text: "Henüz yayımlanmış kampanya bulunmuyor." }));
    const reports = await db.select("belgeler", "kategori=eq.faaliyet_raporu&durum=eq.yayinda&deleted_at=is.null&order=created_at.desc");
    const reportRoot = document.getElementById("faaliyet-raporlari");
    if (reportRoot) {
      reportRoot.replaceChildren(...reports.map(doc => {
        try { const url = new URL(doc.dosya_url); if (url.protocol === "https:") return el("p", {}, [el("a", { href: url.href, text: doc.baslik, target: "_blank", rel: "noopener noreferrer" })]); } catch {}
        return el("p", { text: doc.baslik });
      }));
      if (!reports.length) reportRoot.appendChild(el("p", { text: "Faaliyet raporları henüz yayımlanmamış." }));
    }
  } catch { root.replaceChildren(el("p", { role: "status", text: "Kampanyalar şu anda yüklenemiyor." })); }
}

export function sosyalBaglantilariGuncelle(settings) {
  document.querySelectorAll("[data-sosyal]").forEach(link => {
    try { const url = new URL(settings[link.dataset.sosyal]); if (url.protocol !== "https:") throw new Error(); link.href = url.href; link.hidden = false; }
    catch { link.hidden = true; }
  });
}

export function takvimIndir(row) {
  const escape = value => String(value || "").replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replace(/\r?\n/g, "\\n");
  const date = value => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BABDER//Etkinlikler//TR", "BEGIN:VEVENT", `UID:${row.id}@babder`, `DTSTAMP:${date(Date.now())}`, `DTSTART:${date(row.baslangic_tarihi)}`, ...(row.bitis_tarihi ? [`DTEND:${date(row.bitis_tarihi)}`] : []), `SUMMARY:${escape(row.baslik)}`, `DESCRIPTION:${escape(row.aciklama)}`, `LOCATION:${escape(row.konum)}`, "END:VEVENT", "END:VCALENDAR"];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" }));
  const link = el("a", { href: url, download: "babder-etkinlik.ics" });
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ayTakviminiHazirla(rows) {
  const root = document.getElementById("etkinlik-ay-gorunumu");
  if (!root) return;
  let month = new Date(); month.setDate(1);
  const title = el("h2");
  const grid = el("div", { class: "ay-takvimi" });
  const draw = () => {
    title.textContent = month.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    grid.replaceChildren(...["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(text => el("div", { class: "takvim-gun-baslik", text })));
    const offset = (month.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) grid.appendChild(el("div", { "aria-hidden": "true" }));
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const cell = el("div", { class: "takvim-gun" }, [el("strong", { text: String(day) })]);
      const dayRows = rows.filter(row => { const d = new Date(row.baslangic_tarihi); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth() && d.getDate() === day; });
      dayRows.forEach(row => cell.appendChild(el("button", { type: "button", class: "takvim-etkinlik", text: row.baslik, "aria-label": `${row.baslik} takvime indir`, onclick: () => takvimIndir(row) })));
      grid.appendChild(cell);
    }
  };
  root.replaceChildren(el("div", { class: "takvim-kontroller" }, [el("button", { type: "button", class: "btn btn-ikincil", text: "Önceki ay", onclick: () => { month.setMonth(month.getMonth() - 1); draw(); } }), title, el("button", { type: "button", class: "btn btn-ikincil", text: "Sonraki ay", onclick: () => { month.setMonth(month.getMonth() + 1); draw(); } })]), grid);
  draw();
}
