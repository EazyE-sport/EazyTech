const money = (v) => v.toLocaleString("ru-RU").replace(/,/g, " ") + " ₴";

export function draw(wrap, d) {
  const max = Math.max(...d.shops.map((s) => s.price), d.fairPrice) * 1.1;
  const top = (1 - d.fairPrice / max) * 100;

  wrap.innerHTML = `
    <div class="fair-line" style="--top:${top.toFixed(1)}%">
      <span>fair ${money(d.fairPrice)}</span>
    </div>
    ${d.shops.map((s, i) => `
      <div class="pc-bar ${s.price <= d.fairPrice ? "ok" : "bad"}"
           style="--h:${(s.price / max * 100).toFixed(1)}%; --d:${i * 110}ms">
        <b>${money(s.price)}</b>
        <span class="shop">${s.name}</span>
      </div>`).join("")}`;
}
