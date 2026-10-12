const allowedOrigins = (Deno.env.get("FORM_ALLOWED_ORIGINS") || "").split(",").map(value => value.trim()).filter(Boolean);
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY") || "";
const ipSalt = Deno.env.get("FORM_IP_SALT") || "";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const cors = { "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "null", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
  const reply = (status: number, message: string) => new Response(JSON.stringify({ message }), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (!allowedOrigins.includes(origin)) return reply(403, "Bu kaynaktan form gönderilemez.");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return reply(405, "Geçersiz işlem.");
  if (!serviceKey || !turnstileSecret || !ipSalt || !supabaseUrl) return reply(503, "Form servisi şu anda kullanılamıyor.");
  try {
    const raw = await req.text();
    if (raw.length > 12000) return reply(400, "Form verisi çok uzun.");
    const body = JSON.parse(raw);
    if (!["iletisim", "uyelik"].includes(body.tur) || typeof body.token !== "string" || body.token.length > 2048) return reply(400, "Doğrulama bilgisi eksik.");
    const input = body.veri || {};
    const text = (key: string, min: number, max: number, optional = false) => {
      const value = typeof input[key] === "string" ? input[key].trim() : "";
      if ((!optional || value) && (value.length < min || value.length > max)) throw new Error("validation");
      return value;
    };
    const ad_soyad = text("ad_soyad", 3, 100);
    const eposta = text("eposta", 3, 150, body.tur === "uyelik").toLowerCase();
    if ((eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) || input.kvkk_onay !== true) return reply(400, "Bilgileri ve KVKK onayını kontrol edin.");
    const veri = body.tur === "iletisim"
      ? { ad_soyad, eposta, kvkk_onay: true, konu: text("konu", 2, 150), mesaj: text("mesaj", 10, 5000) }
      : { ad_soyad, eposta, kvkk_onay: true, telefon: text("telefon", 10, 30), koy_bagi: text("koy_bagi", 1, 120), mesaj: text("mesaj", 0, 2000, true) };
    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (!ip) return reply(503, "İstek doğrulanamadı.");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ipSalt}:${ip}`));
    const ipHash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
    const rate = await fetch(`${supabaseUrl}/rest/v1/rpc/form_hiz_sinirini_kullan`, { method: "POST", headers, body: JSON.stringify({ p_ip_hash: ipHash }) });
    if (!rate.ok) return reply(503, "Form servisi şu anda kullanılamıyor.");
    if (!(await rate.json())) return reply(429, "Saatlik gönderim sınırına ulaşıldı. Lütfen daha sonra deneyin.");
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: new URLSearchParams({ secret: turnstileSecret, response: body.token, remoteip: ip }) });
    const result = await verification.json();
    if (!result.success || result.hostname !== new URL(origin).hostname || result.action !== "babder_form") return reply(400, "Güvenlik doğrulaması başarısız. Yeniden deneyin.");
    const table = body.tur === "iletisim" ? "iletisim_mesajlari" : "uyelik_basvurulari";
    const inserted = await fetch(`${supabaseUrl}/rest/v1/${table}`, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(veri) });
    return inserted.ok ? reply(200, "Formunuz iletildi.") : reply(503, "Form iletilemedi. Lütfen daha sonra deneyin.");
  } catch { return reply(400, "Form bilgileri geçersiz veya istek tamamlanamadı."); }
});
