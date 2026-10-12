import { CONFIG } from "./config.js";

class SupabaseApi {
  constructor() {
    this.url = CONFIG.SUPABASE_URL;
    this.key = CONFIG.SUPABASE_ANON_KEY;
    this.refreshPromise = null;
    ["babder_token", "babder_refresh_token", "babder_expires_at", "babder_user"].forEach(key => localStorage.removeItem(key));
  }

  _getHeaders(ekBasliklar = {}, token = null) {
    const accessToken = token || sessionStorage.getItem("babder_token");
    return {
      "apikey": this.key,
      "Authorization": `Bearer ${accessToken || this.key}`,
      "Content-Type": "application/json",
      ...ekBasliklar
    };
  }

  async _validToken() {
    const token = sessionStorage.getItem("babder_token");
    const expiresAt = Number(sessionStorage.getItem("babder_expires_at") || 0);
    if (!token || !expiresAt || Date.now() < expiresAt - 60000) return token;
    const refreshToken = sessionStorage.getItem("babder_refresh_token");
    if (!refreshToken) return token;
    if (!this.refreshPromise) {
      this.refreshPromise = fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: this.key, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
      }).then(async response => {
        if (!response.ok) throw new Error("Oturum yenilenemedi.");
        const session = await response.json();
        sessionStorage.setItem("babder_token", session.access_token);
        sessionStorage.setItem("babder_refresh_token", session.refresh_token);
        sessionStorage.setItem("babder_expires_at", String(Date.now() + session.expires_in * 1000));
        return session.access_token;
      }).catch(() => {
        this.signOut();
        return null;
      }).finally(() => { this.refreshPromise = null; });
    }
    return this.refreshPromise;
  }

  async _request(path, options = {}) {
    const token = await this._validToken();
    const response = await fetch(`${this.url}${path}`, { ...options, headers: this._getHeaders(options.headers, token) });
    if (!response.ok) {
      let detail = "";
      try {
        const error = await response.json();
        detail = error.message || error.error_description || error.details || error.hint || "";
      } catch { /* Some gateway errors do not return JSON. */ }
      throw new Error(detail || `Supabase isteği başarısız (${response.status}).`);
    }
    return response;
  }

  async select(tablo, filtreler = "") {
    const yanit = await this._request(`/rest/v1/${encodeURIComponent(tablo)}?${filtreler}`, { method: "GET" });
    return yanit.json();
  }

  async insert(tablo, veri) {
    const yanit = await this._request(`/rest/v1/${encodeURIComponent(tablo)}`, {
      method: "POST",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify(veri)
    });
    return true;
  }

  async update(tablo, id, veri) {
    const primaryKey = tablo === "ayarlar" ? "anahtar" : "id";
    const yanit = await this._request(`/rest/v1/${encodeURIComponent(tablo)}?${primaryKey}=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(veri)
    });
    const rows = await yanit.json();
    if (Array.isArray(rows) && rows.length === 0) throw new Error("Güncellenecek kayıt bulunamadı veya yetkiniz yok.");
    return rows;
  }

  async delete(tablo, id) {
    const yanit = await this._request(`/rest/v1/${encodeURIComponent(tablo)}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Prefer": "return=representation" },
    });
    const rows = await yanit.json();
    if (Array.isArray(rows) && rows.length === 0) throw new Error("Silinecek kayıt bulunamadı veya yetkiniz yok.");
    return true;
  }

  async rpc(functionName, args = {}) {
    const response = await this._request(`/rest/v1/rpc/${encodeURIComponent(functionName)}`, {
      method: "POST",
      body: JSON.stringify(args)
    });
    return response.json();
  }

  async upload(bucket, path, file, contentType = file.type) {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const response = await this._request(`/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
      method: "POST",
      headers: { "Content-Type": contentType, "x-upsert": "false" },
      body: file
    });
    await response.json();
    return `${this.url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
  }

  async removeStorageObject(bucket, path) {
    const response = await this._request(`/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: "DELETE",
      body: JSON.stringify({ prefixes: [path] })
    });
    return response.ok;
  }

  async signIn(email, password) {
    const yanit = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": this.key, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const sonuc = await yanit.json();
    if (!yanit.ok) throw new Error(sonuc.error_description || "Giriş başarısız.");
    sessionStorage.setItem("babder_token", sonuc.access_token);
    sessionStorage.setItem("babder_refresh_token", sonuc.refresh_token);
    sessionStorage.setItem("babder_expires_at", String(Date.now() + sonuc.expires_in * 1000));
    sessionStorage.setItem("babder_user", JSON.stringify(sonuc.user));
    return sonuc;
  }

  async authUser() { return (await this._request("/auth/v1/user")).json(); }
  async mfaEnroll() { return (await this._request("/auth/v1/factors", { method: "POST", body: JSON.stringify({ factor_type: "totp", friendly_name: `BABDER-${Date.now()}`, issuer: "BABDER" }) })).json(); }
  async mfaUnenroll(factorId) { return this._request(`/auth/v1/factors/${encodeURIComponent(factorId)}`, { method: "DELETE" }); }
  async mfaVerify(factorId, code) {
    const challenge = await (await this._request(`/auth/v1/factors/${encodeURIComponent(factorId)}/challenge`, { method: "POST", body: "{}" })).json();
    const session = await (await this._request(`/auth/v1/factors/${encodeURIComponent(factorId)}/verify`, { method: "POST", body: JSON.stringify({ challenge_id: challenge.id, code }) })).json();
    sessionStorage.setItem("babder_token", session.access_token);
    sessionStorage.setItem("babder_refresh_token", session.refresh_token);
    sessionStorage.setItem("babder_expires_at", String(Date.now() + session.expires_in * 1000));
    if (session.user) sessionStorage.setItem("babder_user", JSON.stringify(session.user));
    return session;
  }

  assuranceLevel() {
    try { const payload = sessionStorage.getItem("babder_token").split(".")[1].replaceAll("-", "+").replaceAll("_", "/"); return JSON.parse(atob(payload)).aal || "aal1"; }
    catch { return "aal1"; }
  }

  signOut(reason = "") {
    const token = sessionStorage.getItem("babder_token");
    if (token) fetch(`${this.url}/auth/v1/logout`, { method: "POST", headers: { apikey: this.key, Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {});
    if (reason) sessionStorage.setItem("babder_login_error", reason);
    else sessionStorage.removeItem("babder_login_error");
    sessionStorage.removeItem("babder_token");
    sessionStorage.removeItem("babder_refresh_token");
    sessionStorage.removeItem("babder_expires_at");
    sessionStorage.removeItem("babder_user");
    window.location.href = "/yonetim/giris.html";
  }
}

export const db = new SupabaseApi();
