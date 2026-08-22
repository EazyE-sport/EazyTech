const fine = matchMedia("(pointer: fine)").matches;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

let dot, ring, x = 0, y = 0, rx = 0, ry = 0, seen = false;

function make(cls) {
  const el = document.createElement("div");
  el.className = cls;
  document.body.append(el);
  return el;
}

function loop() {
  rx += (x - rx) * 0.15;
  ry += (y - ry) * 0.15;
  ring.style.transform = `translate3d(${rx - ring.offsetWidth / 2}px, ${ry - ring.offsetHeight / 2}px, 0)`;
  if (seen) requestAnimationFrame(loop);
}

export function init() {
  if (!fine || calm) return;
  document.documentElement.classList.add("has-cursor");
  dot = make("cursor-dot");
  ring = make("cursor-ring");

  addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    dot.style.transform = `translate3d(${x - 2}px, ${y - 2}px, 0)`;
    if (!seen) {
      seen = true;
      ring.style.transform = `translate3d(${x - 16}px, ${y - 16}px, 0)`;
      rx = x;
      ry = y;
      requestAnimationFrame(loop);
    }
  }, { passive: true });

  document.addEventListener("mouseover", (e) => {
    const hot = e.target.closest("a, button, label, input, select, [data-cursor], .radar-dot, .tl-dot");
    ring.classList.toggle("on", !!hot);
    ring.classList.toggle("bad", !!e.target.closest(".tag-bad"));
  });

  addEventListener("mousedown", () => ring.classList.add("down"));
  addEventListener("mouseup", () => ring.classList.remove("down"));
  document.addEventListener("mouseleave", () => {
    dot.style.opacity = 0;
    ring.style.opacity = 0;
  });
  document.addEventListener("mouseenter", () => {
    dot.style.opacity = 1;
    ring.style.opacity = 1;
  });
}
