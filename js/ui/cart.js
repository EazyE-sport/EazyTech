import { fmt } from "../data/settings.js";
import { toast } from "./toast.js";

const KEY = "et-cart";

const initials = (n) => n.split(" ").slice(0, 2).map((w) => w[0]).join("");

export function get() {
  try {
    const l = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(l) ? l : [];
  } catch {
    return [];
  }
}

function save(l) {
  try {
    localStorage.setItem(KEY, JSON.stringify(l));
  } catch {
    /* приватный режим — корзина живёт до перезагрузки */
  }
}

export function add(id) {
  const l = get();
  const it = l.find((x) => x.id === id);
  if (it) it.qty = Math.min(it.qty + 1, 99);
  else l.push({ id, qty: 1 });
  save(l);
  update();
  toast("Добавлено в корзину");
}

export function setQty(id, qty) {
  const l = get();
  const it = l.find((x) => x.id === id);
  if (!it) return;
  it.qty = Math.max(1, Math.min(99, qty));
  save(l);
  update();
}

export function remove(id) {
  save(get().filter((x) => x.id !== id));
  update();
}

export function clear() {
  save([]);
  update();
}

export function count() {
  return get().reduce((a, b) => a + b.qty, 0);
}

export function qty(id) {
  return get().find((x) => x.id === id)?.qty || 0;
}

let btn, badge, modal, listFn;

function update() {
  if (!badge) return;
  const n = count();
  badge.textContent = n > 99 ? "99+" : n;
  badge.hidden = n === 0;
  if (modal?.classList.contains("open")) render();
}

export function init(getList) {
  listFn = getList;

  btn = document.createElement("button");
  btn.className = "cart-btn";
  btn.setAttribute("aria-label", "Корзина");
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.6 12.4a1 1 0 0 0 1 .8h7.9a1 1 0 0 0 1-.8L19 8H6"/></svg><span class="cart-badge" hidden></span>`;
  badge = btn.querySelector(".cart-badge");

  const nav = document.querySelector(".nav-in");
  nav.insertBefore(btn, nav.querySelector(".burger"));

  modal = document.createElement("div");
  modal.className = "picker cart-modal";
  modal.innerHTML = `
    <div class="picker-box cart-box">
      <h3>Корзина</h3>
      <div class="cart-list"></div>
      <div class="cart-foot"></div>
    </div>`;
  document.body.append(modal);

  btn.addEventListener("click", open);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-cart-close]")) close();
  });

  update();
}

function open() {
  render();
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function close() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
}

async function render() {
  const list = await listFn();
  const items = get();
  const boxList = modal.querySelector(".cart-list");
  const boxFoot = modal.querySelector(".cart-foot");

  if (!items.length) {
    boxList.innerHTML = `
      <div class="cart-empty">
        <span class="empty-q">?</span>
        <p>Корзина пуста</p>
        <a class="btn btn--ghost" href="category.html" data-cart-close>В каталог</a>
      </div>`;
    boxFoot.innerHTML = "";
    return;
  }

  let total = 0;
  boxList.innerHTML = items.map((it) => {
    const d = list.find((x) => x.id === it.id);
    if (!d) return "";
    total += d.price * it.qty;
    return `
      <div class="cart-item">
        <span class="ci-thumb">${d.images?.[0]
          ? `<img src="${d.images[0]}" alt="">`
          : `<i>${initials(d.name)}</i>`}</span>
        <span class="ci-info">
          <a class="lnk" href="device.html?id=${d.id}" data-cart-close>${d.name}</a>
          <span class="ci-price">${fmt(d.price)} × ${it.qty} = <b>${fmt(d.price * it.qty)}</b></span>
        </span>
        <span class="ci-qty">
          <button data-q="-1" data-id="${d.id}" aria-label="Меньше">−</button>
          <b>${it.qty}</b>
          <button data-q="1" data-id="${d.id}" aria-label="Больше">+</button>
        </span>
        <button class="ci-del" data-del="${d.id}" aria-label="Убрать">×</button>
      </div>`;
  }).join("");

  boxFoot.innerHTML = `
    <div class="cart-total">Итого: <b>${fmt(total)}</b></div>
    <div class="cart-acts">
      <button class="btn btn--ghost" data-clear>Очистить</button>
      <button class="btn btn--acc" data-checkout>Оформить</button>
    </div>`;

  boxFoot.querySelector("[data-clear]")?.addEventListener("click", () => {
    clear();
    toast("Корзина очищена");
  });
  boxFoot.querySelector("[data-checkout]")?.addEventListener("click", () => {
    toast("Оформление заказа — скоро");
  });

  boxList.querySelectorAll("[data-q]").forEach((b) => {
    b.addEventListener("click", () => {
      const it = get().find((x) => x.id === b.dataset.id);
      if (it) setQty(b.dataset.id, it.qty + +b.dataset.q);
    });
  });
  boxList.querySelectorAll("[data-del]").forEach((b) => {
    b.addEventListener("click", () => remove(b.dataset.del));
  });
}
