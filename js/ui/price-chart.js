import { fmt as money, toUah } from "../data/settings.js";

export function draw(wrap, d) {
  const prices = d.shops.map((s) => toUah(s.price));
  const max = Math.max(...prices, d.fairPrice) * 1.1;
  const top = (1 - d.fairPrice / max) * 100;

  wrap.innerHTML = `
    <div class="fair-line" style="--top:${top.toFixed(1)}%">
      <span>fair ${money(d.fairPrice)}</span>
    </div>
    ${d.shops.map((s, i) => {
      const p = prices[i];
      return `
      <div class="pc-bar ${p <= d.fairPrice ? "ok" : "bad"}"
           style="--h:${(p / max * 100).toFixed(1)}%; --d:${i * 110}ms">
        <b>${money(p)}</b>
        <span class="shop">${s.name}</span>
      </div>`;
    }).join("")}`;
}
