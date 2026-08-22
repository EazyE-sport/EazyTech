const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

let wipe;

function build() {
  wipe = document.createElement("div");
  wipe.className = "wipe";
  wipe.setAttribute("aria-hidden", "true");
  wipe.innerHTML = "<i></i>".repeat(8);
  document.body.append(wipe);
}

function kill() {
  document.querySelectorAll(".wipe").forEach((el) => el.remove());
  wipe = null;
}

export function init() {
  if (calm) return;

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#") || !/\.html(\?|$)/.test(href)) return;
    e.preventDefault();
    if (!wipe) build();
    wipe.classList.remove("open");
    void wipe.offsetWidth;
    wipe.classList.add("play");
    setTimeout(() => (location.href = href), 460);
  });

  // после любого показа страницы — свежая загрузка или восстановление
  // из bfcache кнопкой «назад» — сносим все полосы перехода, иначе
  // они остаются растянутыми поверх контента (белый экран)
  addEventListener("pageshow", kill);
  addEventListener("visibilitychange", () => {
    if (!document.hidden) kill();
  });
}
