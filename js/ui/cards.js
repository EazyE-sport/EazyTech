const C = 94.2;

export const tint = (r) => (r < 6 ? "bad" : r < 7.5 ? "mid" : "good");

const money = (v) => v.toLocaleString("ru-RU").replace(/,/g, " ") + " ₴";

function ring(r) {
  const off = C * (1 - r / 10);
  return `<span class="ring ${tint(r)}">
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle class="track" cx="22" cy="22" r="15"></circle>
      <circle class="bar" cx="22" cy="22" r="15" style="--off:${off}"></circle>
    </svg>
    <b>${r.toFixed(1)}</b>
  </span>`;
}

function tags(d) {
  const out = [];
  if (d.rating < 6.5) out.push('<span class="tag tag-bad">Колхоз</span>');
  else if (d.price <= d.fairPrice) out.push('<span class="tag tag-deal">Fair deal</span>');
  return out.join("");
}

function thumb(d) {
  if (!d.image) return `<div class="thumb-ph">${d.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}</div>`;
  return `<img src="${d.image}" alt="${d.name}" loading="lazy">`;
}

export function card(d, i = 0) {
  const el = document.createElement("a");
  el.href = `device.html?id=${d.id}`;
  el.className = "card in-new tilt";
  el.style.setProperty("--d", `${i * 80}ms`);
  el.innerHTML = `
    <span class="glare"></span>
    <span class="tags">${tags(d)}</span>
    <span class="thumb">${thumb(d)}</span>
    <span class="card-body">
      <span>
        <span class="name">${d.name}</span>
        <span class="short">${d.short}</span>
      </span>
      ${ring(d.rating)}
    </span>
    <span class="card-foot">
      <span>${d.reviews} обзоров</span>
    </span>`;

  const img = el.querySelector("img");
  if (img) {
    img.addEventListener("error", () => {
      img.replaceWith(Object.assign(document.createElement("div"), {
        className: "thumb-ph",
        textContent: d.name.split(" ").slice(0, 2).map((w) => w[0]).join(""),
      }));
    });
  }

  const price = document.createElement("span");
  price.className = "price";
  price.innerHTML = `<em>0 ₴</em>`;
  el.querySelector(".card-foot").prepend(price);

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

export function render(grid, list) {
  grid.innerHTML = "";
  list.forEach((d, i) => {
    const c = card(d, i);
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
