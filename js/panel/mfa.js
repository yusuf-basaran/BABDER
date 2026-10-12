import { db } from "../api.js";
import { el } from "../utils.js";
import { panelRehberiniGoster } from "./rehber.js";

export async function mfaAkisiniGoster(root, onSuccess) {
  const user = await db.authUser();
  let factor = user.factors?.find(item => item.factor_type === "totp" && item.status === "verified");
  root.replaceChildren(el("h2", { text: "İki Adımlı Doğrulama" }));
  const rehberAlani = el("div");
  panelRehberiniGoster(rehberAlani, "mfa");
  // Panelde üst rehber vardır; giriş ekranında da aynı açıklamayı göster.
  if (!document.getElementById("panel-kullanim-rehberi")) root.appendChild(rehberAlani);
  if (!factor) {
    for (const unfinished of user.factors?.filter(item => item.factor_type === "totp" && item.status === "unverified") || []) await db.mfaUnenroll(unfinished.id);
    factor = await db.mfaEnroll();
    root.appendChild(el("p", { text: "Doğrulama uygulamanıza aşağıdaki kurulum anahtarını ekleyin. Ardından uygulamadaki altı haneli kodu girin." }));
    root.appendChild(el("code", { text: factor.totp.secret, style: "display:block;overflow-wrap:anywhere;user-select:all;margin:1rem 0;" }));
  } else root.appendChild(el("p", { text: "Doğrulama uygulamanızdaki altı haneli kodu girin." }));
  const code = el("input", { type: "text", class: "form-denetim", inputMode: "numeric", autocomplete: "one-time-code", pattern: "[0-9]{6}", maxLength: 6, required: true, "aria-label": "Altı haneli doğrulama kodu" });
  const status = el("p", { role: "status", "aria-live": "polite" });
  const button = el("button", { type: "submit", class: "btn btn-ana", text: "Doğrula" });
  const form = el("form", {}, [code, button, status]);
  root.appendChild(form);
  form.addEventListener("submit", async event => {
    event.preventDefault(); button.disabled = true;
    try { await db.mfaVerify(factor.id, code.value.trim()); onSuccess(); }
    catch { status.setAttribute("role", "alert"); status.textContent = "Kod doğrulanamadı. Yeni kodu kontrol edip yeniden deneyin."; button.disabled = false; }
  });
  code.focus();
}
