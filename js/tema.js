export function temaYonetiminiBaslat() {
  const button = document.getElementById("tema-degistirici");
  const saved = localStorage.getItem("babder_tema");
  const apply = theme => {
    const dark = theme === "koyu";
    document.documentElement.setAttribute("data-tema", dark ? "koyu" : "varsayilan");
    if (button) {
      button.textContent = dark ? "Açık tema" : "Koyu tema";
      button.setAttribute("aria-label", dark ? "Açık temaya geç" : "Koyu temaya geç");
      button.setAttribute("aria-pressed", String(dark));
    }
  };
  apply(saved === "koyu" ? "koyu" : "varsayilan");
  button?.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-tema") === "koyu" ? "varsayilan" : "koyu";
    localStorage.setItem("babder_tema", next);
    apply(next);
  });
}
