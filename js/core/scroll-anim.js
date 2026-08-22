const io = ("IntersectionObserver" in window)
  ? new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        show(en.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -4% 0px" })
  : null;

function show(el) {
  if (el.classList.contains("in")) return;
  el.classList.add("in");
  io?.unobserve(el);
  el.addEventListener("transitionend", () => {
    el.style.willChange = "";
  }, { once: true });
}

export function watch(root, base = 80) {
  const list = root.querySelectorAll("[data-reveal]");
  list.forEach((el, i) => {
    if (!el.style.getPropertyValue("--d")) {
      el.style.setProperty("--d", `${i * base}ms`);
    }
    el.style.willChange = "transform, opacity, filter";
    if (!io) {
      show(el);
      return;
    }
    // уже в зоне видимости — показываем сразу, иначе наблюдаем
    if (el.getBoundingClientRect().top < innerHeight * 0.9) {
      setTimeout(() => show(el), 60 + i * base);
      io.unobserve(el);
      return;
    }
    io.observe(el);
  });
}

// страховка: если IntersectionObserver не сработал (кеш браузера,
// bfcache), через пару секунд всё равно показываем — невидимых дыр нет
setTimeout(() => {
  document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => show(el));
}, 2500);

export function init() {
  watch(document, 0);
}
