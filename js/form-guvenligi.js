import { CONFIG, TURNSTILE_SITE_KEY } from "./config.js";
const widgets = new Map();
export function formGonderimeHazir(form) { return Boolean(widgets.get(form)?.token); }

export function formGuvenliginiBaslat() {
  const forms = [...document.querySelectorAll("#iletisim-formu, #uyelik-formu")];
  if (!forms.length) return;
  forms.forEach(form => form.querySelector('[type="submit"]').disabled = true);
  if (!TURNSTILE_SITE_KEY || TURNSTILE_SITE_KEY.startsWith("[")) {
    forms.forEach(form => {
      const message = document.createElement("p"); message.setAttribute("role", "status"); message.textContent = "Form şu anda kullanılamıyor. Lütfen dernek iletişim bilgilerini kullanın."; form.appendChild(message);
    });
    return;
  }
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.onload = () => forms.forEach(form => {
    const container = document.createElement("div");
    const button = form.querySelector('[type="submit"]'); button.before(container);
    const state = { token: "", id: "" }; widgets.set(form, state);
    state.id = window.turnstile.render(container, { sitekey: TURNSTILE_SITE_KEY, action: "babder_form", callback: token => { state.token = token; button.disabled = false; }, "expired-callback": () => { state.token = ""; button.disabled = true; }, "error-callback": () => { state.token = ""; button.disabled = true; } });
  });
  script.onerror = () => forms.forEach(form => { const text = document.createElement("p"); text.setAttribute("role", "alert"); text.textContent = "Güvenlik doğrulaması yüklenemedi. Sayfayı yenileyin."; form.appendChild(text); });
  document.head.appendChild(script);
}

export async function guvenliFormGonder(tur, veri, form) {
  const state = widgets.get(form);
  if (!state?.token) throw new Error("Lütfen güvenlik doğrulamasını tamamlayın.");
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/form-gonder`, { method: "POST", headers: { apikey: CONFIG.SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ tur, veri, token: state.token }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Form gönderilemedi.");
  } finally { state.token = ""; window.turnstile.reset(state.id); }
}
