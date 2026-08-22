const io = new IntersectionObserver((es) => {
  es.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add("in");
    io.unobserve(el);
    el.addEventListener("transitionend", () => {
      el.style.willChange = "";
    }, { once: true });
  });
}, { threshold: 0.15, rootMargin: "0px 0px -4% 0px" });

export function watch(root, base = 80) {
  const list = root.querySelectorAll("[data-reveal]");
  list.forEach((el, i) => {
    if (!el.style.getPropertyValue("--d")) {
      el.style.setProperty("--d", `${i * base}ms`);
    }
    el.style.willChange = "transform, opacity, filter";
    io.observe(el);
  });
}

export function init() {
  watch(document, 0);
}
