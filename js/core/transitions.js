const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

let wipe;

function build() {
  wipe = document.createElement("div");
  wipe.className = "wipe";
  wipe.setAttribute("aria-hidden", "true");
  wipe.innerHTML = "<i></i>".repeat(8);
  document.body.append(wipe);
}

export function init() {
  if (calm) return;
  build();

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

  addEventListener("pageshow", (e) => {
    if (e.persisted) return;
    wipe.classList.remove("play");
    void wipe.offsetWidth;
    wipe.classList.add("open");
    setTimeout(() => wipe.classList.remove("open"), 900);
  });
}
