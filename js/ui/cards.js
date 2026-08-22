import { avg } from "../data/loader.js";
import { fmt as money } from "../data/settings.js";

const fmtScore = (v) => Math.round(v).toLocaleString("ru-RU").replace(/,/g, " ");

export const tint = (r) => (r < 6 ? "bad" : r < 7.5 ? "mid" : "good");

const initials = (name) => name.split(" ").slice(0, 2).map((w) => w[0]).join("");

function tags(d) {
  const out = [];
  if (d.kolhoz) out.push('<span class="tag tag-bad">Колхоз</span>');
  if (d.price <= d.fairPrice) out.push('<span class="tag tag-deal">Fair deal</span>');
  return out.join("");
}

function tagTop(rank) {
  if (!rank || rank > 10) return "";
  return `<span class="rank${rank <= 3 ? " rank--hi" : ""}">ТОП ${rank}</span>`;
}

function thumb(d) {
  const src = (d.images || [])[0];
  if (!src) return `<div class="thumb-ph">${initials(d.name)}</div>`;
  return `<img src="${src}" alt="${d.name}" loading="lazy">`;
}

export function card(d, i = 0, rank = 0) {
  const el = document.createElement("a");
  el.href = `device.html?id=${d.id}`;
  el.className = "card in-new tilt";
  el.style.setProperty("--d", `${i * 80}ms`);
  el.innerHTML = `
    <span class="glare"></span>
    <span class="tags">${tags(d)}</span>
    ${tagTop(rank)}
    <span class="thumb">${thumb(d)}</span>
    <span class="card-body">
      <span>
        <span class="name">${d.name}</span>
        <span class="short">${d.short}</span>
      </span>
      <span class="score"><b>${fmtScore(avg(d))}</b><i>ср. балл</i></span>
    </span>
    <span class="card-foot">
      <span class="price"><em>${money(0)}</em></span>
      <span>${(d.reviews || []).length} обзоров</span>
    </span>`;

  const img = el.querySelector("img");
  if (img) {
    img.addEventListener("error", () => {
      img.replaceWith(Object.assign(document.createElement("div"), {
        className: "thumb-ph",
        textContent: initials(d.name),
      }));
    });
  }

  tilt(el);
  return el;
}

function tilt(el) {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform 60ms linear, border-color 300ms, box-shadow 300ms";
    el.style.setProperty("--ry", `${(px * 5).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
  });

  el.addEventListener("mouseleave", () => {
    el.style.transition = "";
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  });
}

export function render(grid, list, rmap) {
  grid.innerHTML = "";
  list.forEach((d, i) => {
    const c = card(d, i, rmap ? rmap.get(d.id)?.c : 0);
    grid.append(c);
    const price = c.querySelector(".price em");
    if (price && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTimeout(() => countUp(price, d.price), 250 + i * 80);
    }
  });
}

export function countUp(priceEl, to) {
  const t0 = performance.now();
  const dur = 800;
  function step(now) {
    const k = Math.min(1, (now - t0) / dur);
    const ease = 1 - Math.pow(1 - k, 3);
    priceEl.textContent = money(Math.round(to * ease));
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
