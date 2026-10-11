import { CONFIG } from "./config.js";

class SupabaseApi {
  constructor() {
    this.url = CONFIG.SUPABASE_URL;
    this.key = CONFIG.SUPABASE_ANON_KEY;
  }

  _getHeaders(ekBasliklar = {}) {
    const token = localStorage.getItem("babder_token");
    return {
      "apikey": this.key,
      "Authorization": `Bearer ${token ? token : this.key}`,
      "Content-Type": "application/json",
      ...ekBasliklar
    };
  }

  async select(tablo, filtreler = "") {
    try {
      const yanit = await fetch(`${this.url}/rest/v1/${tablo}?${filtreler}`, {
        method: "GET",
        headers: this._getHeaders()
      });
      if (!yanit.ok) throw new Error("Okuma hatası");
      return await yanit.json();
    } catch {
      return null;
    }
  }

  async insert(tablo, veri) {
    const yanit = await fetch(`${this.url}/rest/v1/${tablo}`, {
      method: "POST",
      headers: this._getHeaders({ "Prefer": "return=representation" }),
      body: JSON.stringify(veri)
    });
    if (!yanit.ok) throw new Error("Ekleme başarısız.");
    return await yanit.json();
  }

  async update(tablo, id, veri) {
    const yanit = await fetch(`${this.url}/rest/v1/${tablo}?id=eq.${id}`, {
      method: "PATCH",
      headers: this._getHeaders({ "Prefer": "return=representation" }),
      body: JSON.stringify(veri)
    });
    if (!yanit.ok) throw new Error("Güncelleme başarısız.");
    return await yanit.json();
  }

  async delete(tablo, id) {
    const yanit = await fetch(`${this.url}/rest/v1/${tablo}?id=eq.${id}`, {
      method: "DELETE",
      headers: this._getHeaders()
    });
    if (!yanit.ok) throw new Error("Silme başarısız.");
    return true;
  }

  async signIn(email, password) {
    const yanit = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": this.key, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const sonuc = await yanit.json();
    if (!yanit.ok) throw new Error(sonuc.error_description || "Giriş başarısız.");
    localStorage.setItem("babder_token", sonuc.access_token);
    localStorage.setItem("babder_user", JSON.stringify(sonuc.user));
    return sonuc;
  }

  signOut() {
    localStorage.removeItem("babder_token");
    localStorage.removeItem("babder_user");
    window.location.href = "/yonetim/giris.html";
  }
}

export const db = new SupabaseApi();
