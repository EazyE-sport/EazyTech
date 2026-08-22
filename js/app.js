import { init as fieldInit } from "./core/particles.js";
import { init as transInit } from "./core/transitions.js";
import * as scroll from "./core/scroll-anim.js";
import { all, byId, avg, ranks } from "./data/loader.js";
import { CURRENCIES, getCur, setCur, fmt } from "./data/settings.js";
import * as F from "./data/filters.js";
import * as cards from "./ui/cards.js";
import { draw as radarDraw } from "./ui/radar-chart.js";
import { draw as chartDraw } from "./ui/price-chart.js";
import { draw as cmpDraw, type as typeOut } from "./ui/compare.js";
import { toast } from "./ui/toast.js";
import * as cart from "./ui/cart.js";

const PAGE = document.body.dataset.page;
const CALM = matchMedia("(prefers-reduced-motion: reduce)").matches;

const money = fmt;
const fmtScore = (v) => Math.round(v).toLocaleString("ru-RU").replace(/,/g, " ");

const CATS = { mice: "Мыши", keyboards: "Клавиатуры", headphones: "Наушники" };
const CLASS_L = { budget: "Дешевка", value: "Топ за свои деньги", balanced: "Цена = качество", overpriced: "Оверпрайс" };
const CONN_L = { wired: "Проводная", wireless: "Беспроводная", hybrid: "Комбинированная" };
const MECH_L = { mechanical: "Механика", magnetic: "Магнитка", optical: "Оптическая", membrane: "Мембрана", dynamic: "Динамические" };
const SCORE_L = { community: "Оценка общества", personal: "Личная оценка", ai: "Оценка ИИ" };

const $ = (s, r = document) => r.querySelector(s);

/* ---------- сравнение ---------- */

function cmpList() {
  try {
    return JSON.parse(localStorage.getItem("et-cmp")) || [];
  } catch {
    return [];
  }
}

function cmpSave(list) {
  localStorage.setItem("et-cmp", JSON.stringify(list));
}

/* ---------- настройки ---------- */

const settingsModal = document.createElement("div");
settingsModal.className = "picker";
settingsModal.innerHTML = `
  <div class="picker-box">
    <h3>Настройки</h3>
    <p class="muted" style="font-size:13px">Валюта цен — конвертируется из гривны</p>
    <div class="cur-row">
      ${CURRENCIES.map((c) =>
        `<button class="chip${getCur() === c.id ? " on" : ""}" data-cur="${c.id}">${c.sym} ${c.label}</button>`).join("")}
    </div>
    <div class="s-donat">
      <p>Подобається проєкт? Підтримай автора — каталог живе без реклами і трекерів.</p>
      <a class="btn btn--acc" href="https://donatello.to/MainStreet" target="_blank" rel="noopener">Підтримати на Donatello ❤</a>
    </div>
    <button class="btn btn--ghost" data-close>Закрыть</button>
  </div>`;
document.body.append(settingsModal);

function settingsFx() {
  const gear = document.createElement("button");
  gear.className = "gear";
  gear.setAttribute("aria-label", "Настройки");
  gear.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg>';
  $(".nav-in").insertBefore(gear, $(".burger"));

  const open = (v) => {
    settingsModal.classList.toggle("open", v);
    document.body.style.overflow = v ? "hidden" : "";
  };

  gear.addEventListener("click", () => open(true));
  settingsModal.querySelector("[data-close]").addEventListener("click", () => open(false));
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) open(false);
  });

  settingsModal.querySelectorAll("[data-cur]").forEach((b) => {
    b.addEventListener("click", () => {
      setCur(b.dataset.cur);
      settingsModal.querySelectorAll("[data-cur]").forEach((x) => x.classList.toggle("on", x === b));
      open(false);
      toast(`Валюта: ${b.textContent.trim()}`);
      redraw();
    });
  });
}

function redraw() {
  if (PAGE === "home") homeInit();
  if (PAGE === "cat") catInit();
  if (PAGE === "device") devInit();
  if (PAGE === "cmp") cmpInit();
}

/* ---------- логотип ---------- */

function logoFx() {
  if (CALM || sessionStorage.getItem("et-tt")) return;
  sessionStorage.setItem("et-tt", "1");
  const logo = $(".logo");
  const text = logo.textContent.trim();
  logo.textContent = "";
  [...text].forEach((c, i) => {
    const ch = document.createElement("span");
    ch.className = "ch";
    ch.style.setProperty("--i", `${100 + i * 45}ms`);
    ch.innerHTML = `<b>${c}</b>`;
    logo.append(ch);
  });
  const caret = document.createElement("span");
  caret.className = "caret";
  logo.append(caret);
  setTimeout(() => logo.classList.add("done"), 3200);
}

/* ---------- шапка ---------- */

function navFx() {
  const nav = $(".nav");
  let last = scrollY;
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      if (y > 160 && y > last) nav.classList.add("nav--hidden");
      else if (y < last || y < 100) nav.classList.remove("nav--hidden");
      last = y;
      ticking = false;
    });
  }, { passive: true });

  const burger = $(".burger");
  const menu = $(".menu");
  const toggle = (open) => {
    burger.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggle(!menu.classList.contains("open")));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggle(false)));

  if (PAGE === "cat") {
    const cat = new URLSearchParams(location.search).get("cat");
    if (cat) {
      document.querySelectorAll(".nav-a").forEach((a) => {
        if (a.getAttribute("href") === `category.html?cat=${cat}`) a.classList.add("on");
      });
    }
  }
}

/* ---------- ripple ---------- */

function rippleFx() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".btn");
    if (!b || CALM) return;
    const r = b.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = size + "px";
    s.style.left = e.clientX - r.left - size / 2 + "px";
    s.style.top = e.clientY - r.top - size / 2 + "px";
    b.append(s);
    setTimeout(() => s.remove(), 600);
  });
}

/* ---------- счётчик ---------- */

function counter(el, to, dur = 700) {
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = fmtScore(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ============ главная ============ */

async function homeInit() {
  let list = [];
  try {
    list = await all();
  } catch {
    return;
  }

  const rmap = ranks(list);
  const byCat = (c) => list.filter((d) => d.category === c);

  const tiles = $("#cats");
  tiles.innerHTML = Object.entries(CATS).map(([key, name], i) => `
    <a class="cat-tile${i === 0 ? " cat-tile--wide" : ""}" href="category.html?cat=${key}">
      <span class="n">0${i + 1} / ${name.toUpperCase()}</span>
      <h3>${name}</h3>
      <span class="cnt">${byCat(key).length} устройств</span>
      <span class="arr">→</span>
    </a>`).join("");

  tiles.querySelectorAll(".cat-tile").forEach((t) => {
    if (CALM) return;
    t.addEventListener("mousemove", (e) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", `${e.clientX - r.left}px`);
      t.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  const featured = [...list].sort((a, b) => avg(b) - avg(a)).slice(0, 3);
  cards.render($("#featured"), featured, rmap);

  // рекомендации дня — детерминированные по дате, меняются раз в сутки
  const daily = $("#daily");
  if (daily && list.length) {
    const day = Math.floor(Date.now() / 864e5);
    const i1 = day % list.length;
    let i2 = (day * 7 + 3) % list.length;
    if (i2 === i1) i2 = (i2 + 1) % list.length;
    cards.render(daily, [list[i1], list[i2]], rmap);
    $("#dailyDate").textContent = new Date().toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  }

  const top = featured[0] || {};
  const stats = $("#stats");
  stats.innerHTML = `
    <div class="hstat"><b><i data-n>0</i></b><span>устройств в базе</span></div>
    <div class="hstat"><b><i data-n>0</i></b><span>категории</span></div>
    <div class="hstat"><b><i data-n>0</i></b><span>топ-балл в базе</span></div>`;
  const nums = stats.querySelectorAll("[data-n]");
  const vals = [list.length, Object.keys(CATS).length, avg(top)];
  nums.forEach((n, i) => setTimeout(() => counter(n, vals[i]), 400 + i * 150));

  const how = $("#how");
  how.innerHTML = [
    ["Оценки 0–10 млн", "Общество, личный опыт и ИИ выставляют баллы в формате бенчмарков. Средний балл и места в топах считаются сами."],
    ["Fair price", "Честная цена от редакции против ценников магазинов. Всё, что дороже, — красное и трясётся."],
    ["Когда песочить", "Таймлайн долговечности: ожидаемый срок службы, первые звоночки и момент, когда дешевле выкинуть."],
  ].map(([t, d], i) => `
    <div class="how-i reveal ${i % 2 ? "right" : "left"}" data-reveal>
      <span class="n">0${i + 1}</span>
      <h3>${t}</h3>
      <p>${d}</p>
    </div>`).join("");
  scroll.watch($("#how"), 110);

  const revs = [];
  list.forEach((d) => (d.reviews || []).forEach((r) => revs.push({ d, r })));
  revs.sort((a, b) => (b.r.date || "").localeCompare(a.r.date || ""));
  const latest = revs.slice(0, 4);

  const latSec = $("#latSec");
  if (latest.length) {
    $("#latest").innerHTML = latest.map(({ d, r }) => `
      <div class="lat-item reveal" data-reveal>
        <div class="lat-head">
          <a class="lnk" href="device.html?id=${d.id}">${d.name}</a>
          <span class="rev-score ${cards.tint(r.score)}">${r.score}/10</span>
        </div>
        <p>${r.text}</p>
        <span class="lat-meta">${r.author} · ${r.date}</span>
      </div>`).join("");
    scroll.watch($("#latest"), 110);
  } else {
    latSec.hidden = true;
  }

  const brands = [...new Set(list.map((d) => d.brand).filter(Boolean))];
  const words = ["EAZYTECH", ...brands];
  const row = words.map((w) => `<span>${w} <i>·</i></span>`).join("");
  $("#marquee").innerHTML = `<div class="marquee-track">${row}${row}</div>`;
}

/* ============ каталог ============ */

const qs = new URLSearchParams(location.search);
const catParam = qs.get("cat");
let catData = [];
let page = 1;
let catUI = false;
let rsBound = false;
let cmpUI = false;

const pageSize = () => (innerWidth <= 760 ? 15 : 30);

async function catInit() {
  try {
    catData = await all();
  } catch {
    $("#fErr").hidden = false;
    return;
  }

  if (!catData.length) {
    $("#fErr").hidden = false;
    return;
  }

  F.state.cat = catParam && CATS[catParam] ? catParam : null;
  const title = F.state.cat ? CATS[F.state.cat] : "Каталог";
  $("#catTitle").textContent = title;
  document.title = `${title} — EazyTech`;

  buildChips();
  buildFilters($("#fSide"));
  buildFilters($("#fSheet"));
  paint();

  if (!catUI) {
    catUI = true;
    const fab = $("#fOpen");
    const bg = $("#sheetBg");
    const sheet = $("#sheet");
    const open = (v) => {
      bg.classList.toggle("open", v);
      sheet.classList.toggle("open", v);
      document.body.style.overflow = v ? "hidden" : "";
    };
    fab.addEventListener("click", () => open(true));
    bg.addEventListener("click", () => open(false));
  }

  if (!rsBound) {
    rsBound = true;
    let lastPs = pageSize();
    addEventListener("resize", () => {
      const ps = pageSize();
      if (ps !== lastPs) {
        lastPs = ps;
        paint();
      }
    });
  }
}

function buildChips() {
  const wrap = $("#chips");
  wrap.innerHTML = [["", "Все"], ...Object.entries(CATS)].map(([key, name]) => {
    const n = key ? catData.filter((d) => d.category === key).length : catData.length;
    return `<button class="chip${F.state.cat === key ? " on" : ""}" data-cat="${key}">${name}<i>${n}</i></button>`;
  }).join("");

  wrap.querySelectorAll(".chip").forEach((c) => {
    c.addEventListener("click", () => {
      F.state.cat = c.dataset.cat || null;
      wrap.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === c));
      const t = F.state.cat ? CATS[F.state.cat] : "Каталог";
      $("#catTitle").textContent = t;
      document.title = `${t} — EazyTech`;
      history.replaceState(null, "", F.state.cat ? `category.html?cat=${F.state.cat}` : "category.html");
      paint();
    });
  });
}

function paint() {
  const grid = $("#grid");
  const visible = F.apply(catData);
  const ps = pageSize();
  const pages = Math.max(1, Math.ceil(visible.length / ps));
  page = Math.min(Math.max(1, page), pages);
  const slice = visible.slice((page - 1) * ps, page * ps);

  grid.querySelectorAll(".card").forEach((c, i) => {
    c.style.setProperty("--i", i % 2 ? "-1" : "1");
    c.classList.add("out");
  });

  setTimeout(() => {
    cards.render(grid, slice, ranks(catData));
    $("#fEmpty").hidden = visible.length > 0;
    renderPager(visible.length, page, pages, ps);
  }, 240);
}

function pageNums(p, n) {
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
  const set = new Set([1, 2, p - 1, p, p + 1, n - 1, n]);
  const arr = [...set].filter((x) => x >= 1 && x <= n).sort((a, b) => a - b);
  const out = [];
  arr.forEach((x, i) => {
    if (i && x - arr[i - 1] > 1) out.push("…");
    out.push(x);
  });
  return out;
}

function renderPager(total, cur, pages, ps) {
  const pg = $("#pager");
  if (pages <= 1) {
    pg.hidden = true;
    return;
  }
  pg.hidden = false;
  const from = (cur - 1) * ps + 1;
  const to = Math.min(cur * ps, total);
  pg.innerHTML = `
    <span class="pg-info">${from}–${to} из ${total}</span>
    <div class="pg-btns">
      <button class="pg-btn" data-p="${cur - 1}" ${cur === 1 ? "disabled" : ""}>←</button>
      ${pageNums(cur, pages).map((n) => n === "…"
        ? '<span class="pg-gap">…</span>'
        : `<button class="pg-btn${n === cur ? " on" : ""}" data-p="${n}">${n}</button>`).join("")}
      <button class="pg-btn" data-p="${cur + 1}" ${cur === pages ? "disabled" : ""}>→</button>
    </div>`;

  pg.querySelectorAll("[data-p]").forEach((b) => {
    b.addEventListener("click", () => {
      page = +b.dataset.p;
      paint();
      $("#grid").scrollIntoView({ behavior: CALM ? "auto" : "smooth", block: "start" });
    });
  });
}

const cbSvg = '<svg width="10" height="10" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function group(title, items, g) {
  if (!items.length) return "";
  return `
    <div class="f-group open">
      <button class="f-head">${title} <i>+</i></button>
      <div class="f-body"><div><div class="f-pad">
        ${items.map(([v, l, n]) => `
          <label class="cb"><input type="checkbox" data-g="${g}" value="${v}"><span class="box">${cbSvg}</span>${l}
            <span class="n">${n}</span></label>`).join("")}
      </div></div></div>
    </div>`;
}

function buildFilters(box) {
  const b = F.bounds(catData);
  F.state.min = b.min;
  F.state.max = b.max;

  const tally = (key, filter) => {
    const m = new Map();
    catData.forEach((d) => {
      if (filter && !filter(d)) return;
      const v = d[key];
      if (v) m.set(v, (m.get(v) || 0) + 1);
    });
    return [...m];
  };

  const brandItems = tally("brand").map(([v, n]) => [v, v, n]);
  const clsItems = tally("class").map(([v, n]) => [v, CLASS_L[v] || v, n]);
  const connItems = tally("connection").map(([v, n]) => [v, CONN_L[v] || v, n]);
  const mechItems = tally("mechanism", (d) => d.category === "keyboards")
    .map(([v, n]) => [v, MECH_L[v] || v, n]);

  box.innerHTML = `
    <h3>Фильтры</h3>
    ${group("Класс", clsItems, "cls")}
    ${group("Подключение", connItems, "conn")}
    ${group("Переключатели", mechItems, "mech")}
    ${group("Бренд", brandItems, "brand")}
    <div class="f-group open">
      <button class="f-head">Цена <i>+</i></button>
      <div class="f-body"><div><div class="f-pad">
        <div class="range-row"><label><span>от</span><b data-min></b></label>
          <input type="range" data-r="min" min="${b.min}" max="${b.max}" value="${b.min}"></div>
        <div class="range-row"><label><span>до</span><b data-max></b></label>
          <input type="range" data-r="max" min="${b.min}" max="${b.max}" value="${b.max}"></div>
      </div></div></div>
    </div>
    <div class="f-group open">
      <button class="f-head">Мин. балл <i>+</i></button>
      <div class="f-body"><div><div class="f-pad">
        <div class="range-row"><label><span>от</span><b data-score></b></label>
          <input type="range" data-r="score" min="0" max="10000000" step="100000" value="0"></div>
      </div></div></div>
    </div>
    <div class="f-group open">
      <div class="f-pad">
        <label class="cb"><input type="checkbox" data-deal><span class="box">${cbSvg}</span>Только Fair Deal</label>
      </div>
    </div>
    <p class="f-count">Показано <b data-num>${catData.length}</b> из ${catData.length}</p>
    <button class="btn btn--ghost" data-reset>Сброс</button>`;

  bindGroup(box);
}

function bindGroup(box) {
  box.querySelectorAll(".f-head").forEach((h) =>
    h.addEventListener("click", () => h.parentElement.classList.toggle("open")));

  box.querySelectorAll("input[type='range']").forEach((r) => {
    const set = () => {
      const min = +r.min, max = +r.max, v = +r.value;
      r.style.setProperty("--p", `${((v - min) / (max - min)) * 100}%`);
      const key = r.dataset.r;
      if (key === "min") F.state.min = v;
      if (key === "max") F.state.max = v;
      if (key === "score") F.state.score = v;
      const label = box.querySelector(`[data-${key}]`);
      if (label) label.textContent = key === "score" ? `${(v / 1e6).toFixed(1)} млн` : money(v);
      paint();
    };
    r.addEventListener("input", set);
    set();
  });

  box.querySelectorAll("input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.dataset.deal !== undefined) {
        F.state.deal = cb.checked;
      } else {
        const g = cb.dataset.g;
        const v = cb.value;
        const arr = F.state[g];
        F.state[g] = cb.checked ? [...arr, v] : arr.filter((x) => x !== v);
      }
      paint();
    });
  });

  box.querySelector("[data-reset]").addEventListener("click", () => {
    F.reset();
    box.querySelectorAll("input[type='range']").forEach((r) => {
      r.value = r.dataset.r === "max" ? r.max : r.min;
      r.dispatchEvent(new Event("input"));
    });
    box.querySelectorAll("input[type='checkbox']").forEach((cb) => (cb.checked = false));
    paint();
  });
}

/* ============ устройство ============ */

function metaChips(d) {
  return [
    `<span class="cat-chip">${CATS[d.category] || d.category}</span>`,
    d.class ? `<span class="cat-chip">${CLASS_L[d.class] || d.class}</span>` : "",
    d.connection ? `<span class="cat-chip">${CONN_L[d.connection] || d.connection}</span>` : "",
    d.mechanism ? `<span class="cat-chip">${MECH_L[d.mechanism] || d.mechanism}</span>` : "",
  ].join("");
}

function buildScores(box, d, r) {
  const rows = Object.entries(d.scores || {}).map(([k, v]) => `
    <div class="s-row reveal" data-reveal>
      <span class="s-lab">${SCORE_L[k] || k}</span>
      <span class="s-bar"><i style="--w:${(v / 1e7 * 100).toFixed(1)}%"></i></span>
      <span class="s-val">${fmtScore(v)}</span>
    </div>`).join("");

  box.innerHTML = rows + `
    <div class="s-row avg reveal" data-reveal>
      <span class="s-lab">Средний балл</span>
      <span class="s-avg">${fmtScore(avg(d))}</span>
    </div>
    ${r ? `<p class="s-rank">${rankLine(r, d)}</p>` : ""}`;
}

function rankLine(r, d) {
  const cat = r.c <= 100 ? `ТОП ${r.c}` : `${r.c}`;
  const glob = r.g <= 100 ? `ТОП ${r.g}` : `${r.g}`;
  return `${cat} из ${r.cN} в «${CATS[d.category]}» · ${glob} из ${r.gN} в общем зачёте`;
}

async function devInit() {
  const id = qs.get("id");
  const root = $("#devRoot");
  let d;

  try {
    d = await byId(id);
  } catch {
    root.innerHTML = `<div class="error"><span class="error-t">Ошибка загрузки</span>
      <p class="muted">Данные не доехали. Проверь соединение.</p></div>`;
    return;
  }

  if (!d) {
    root.innerHTML = `<div class="error"><span class="error-t">Не найдено</span>
      <p class="muted">Такого устройства нет в базе.</p>
      <a class="btn btn--ghost" href="category.html">В каталог</a></div>`;
    return;
  }

  document.title = `${d.name} — EazyTech`;

  const list = await all();
  const r = ranks(list).get(d.id);
  const mean = avg(d);
  const halo = mean > 8e6 ? "var(--glow-2)" : mean < 6e6 ? "rgba(255,46,99,0.18)" : "var(--glow)";

  const diff = d.price - d.fairPrice;
  const fair = diff <= 0
    ? `<span class="fair-diff ok">дешевле fair на ${money(-diff)}</span>`
    : `<span class="fair-diff bad">дороже fair на ${money(diff)}</span>`;

  const tags = [];
  if (d.kolhoz) tags.push('<span class="tag tag-bad">Колхоз</span>');
  if (d.price <= d.fairPrice) tags.push('<span class="tag tag-deal">Fair deal</span>');

  const gal = (d.images || []).filter(Boolean);
  const hero = gal[0]
    ? `<img src="${gal[0]}" alt="${d.name}" id="heroImg">`
    : `<div class="thumb-ph" style="font-size:96px">${d.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}</div>`;

  const desc = d.description
    ? `<section class="sec"><div class="sec-head"><h2>Разбор</h2></div>
        <div class="desc">${d.description.split("\n\n").map((p) => `<p>${p}</p>`).join("")}</div>
      </section>` : "";

  const radar = d.bench
    ? `<section class="sec"><div class="sec-head"><h2>Технические оси</h2><span class="idx">10 осей</span></div>
        <div class="radar-wrap reveal" data-reveal id="radar"></div>
      </section>` : "";

  const revs = d.reviews || [];
  const reviews = revs.length
    ? `<section class="sec"><div class="sec-head"><h2>Обзоры</h2><span class="idx">${revs.length}</span></div>
        <div class="reviews">${revs.map((rv) => `
          <div class="rev reveal" data-reveal>
            <div class="rev-head"><b>${rv.author}</b><span>${rv.date}</span>
              <span class="rev-score ${cards.tint(rv.score)}">${rv.score}/10</span></div>
            <p>${rv.text}</p>
          </div>`).join("")}</div>
      </section>` : "";

  root.innerHTML = `
    <p class="anim-fade" style="margin-bottom:20px"><a class="lnk" href="category.html?cat=${d.category}">← ${CATS[d.category] || "Каталог"}</a></p>
    <section class="dev-hero">
      <div class="dev-info">
        <div class="dev-meta">
          ${metaChips(d)}
          ${tags.join("")}
        </div>
        <h1>${d.name}</h1>
        <p class="dev-short">${d.short}</p>
        <div class="dev-price-row">
          <span class="dev-price">${money(d.price)}</span>
          ${fair}
        </div>
        <div class="dev-actions">
          <button class="btn btn--acc" id="cartBtn">В корзину</button>
          <a class="btn btn--ghost" href="compare.html?ids=${d.id}">В сравнение →</a>
          <button class="btn btn--ghost" id="cmpBtn"></button>
        </div>
      </div>
      <div class="dev-visual" style="--halo:${halo}">
        <span class="halo"></span>
        ${hero}
        <span class="cap">средний балл ${fmtScore(mean)}</span>
      </div>
    </section>
    <div class="gal" id="gal" ${gal.length > 1 ? "" : "hidden"}></div>
    <div class="specs">
      ${Object.entries(d.specs || {}).map(([k, v]) => `
        <div class="spec"><span>${k}</span><b>${v}</b></div>`).join("")}
    </div>
    <section class="sec">
      <div class="sec-head"><h2>Оценки</h2><span class="idx">шкала 0–10 млн</span></div>
      <div class="scores" id="scores"></div>
    </section>
    ${desc}
    ${radar}
    <section class="sec">
      <div class="sec-head"><h2>Сильные и слабые</h2></div>
      <div class="pc">
        <div class="pc-col" id="pros">
          <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Сильные стороны</h3>
          ${(d.pros || []).map((p) => `<div class="pc-item pc-pro reveal left" data-reveal>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span>${p}</span></div>`).join("")}
        </div>
        <div class="pc-col" id="cons">
          <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>Слабые стороны</h3>
          ${(d.cons || []).map((c) => `<div class="pc-item pc-con reveal right" data-reveal>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>
            <span>${c}</span></div>`).join("")}
        </div>
      </div>
    </section>
    ${d.life ? `<section class="sec">
      <div class="sec-head"><h2>Когда песочить</h2><span class="idx">ожидаемый срок ${d.life.months} мес</span></div>
      <div class="tl reveal" data-reveal id="tl" style="--w:${(d.life.months / 48) * 100}%">
        <div class="tl-line">
          <span class="tl-dot risk" style="left:${(d.life.risk / 48) * 100}%">
            <span class="tl-tip">${d.life.riskLabel}</span>
          </span>
          <span class="tl-dot dev" style="left:${(d.life.months / 48) * 100}%">
            <span class="lbl">Ожидаемый срок</span>
          </span>
          <span class="tl-dot fail" style="left:${Math.min(d.life.fail / 48, 1) * 100}%">
            <span class="tl-tip">${d.life.failLabel}</span>
          </span>
        </div>
        <div class="tl-ticks"><span>0 мес</span><span>12</span><span>24</span><span>48+ — в утиль</span></div>
      </div>
    </section>` : ""}
    <section class="sec">
      <div class="sec-head"><h2>Цены по магазинам</h2><span class="idx">fair ${money(d.fairPrice)}</span></div>
      <div class="pc-chart reveal" data-reveal id="chart"></div>
    </section>
    ${reviews}`;

  buildScores($("#scores"), d, r);
  if (d.bench) radarDraw($("#radar"), d.bench);
  chartDraw($("#chart"), d);

  const btn = $("#cmpBtn");
  const has = cmpList().includes(d.id);
  btn.textContent = has ? "В сравнении ✓" : "+ Добавить к сравнению";  btn.addEventListener("click", () => {
    const l = cmpList();
    if (l.includes(d.id)) {
      cmpSave(l.filter((x) => x !== d.id));
      btn.textContent = "+ Добавить к сравнению";
      toast("Убрано из сравнения");
    } else {
      const others = l.map((x) => list.find((y) => y.id === x)).filter(Boolean);
      if (others.some((x) => x.category !== d.category)) {
        cmpSave([d.id]);
        btn.textContent = "В сравнении ✓";
        toast("Сравнение сброшено — можно сравнивать только один тип устройств");
        return;
      }
      if (l.length >= 2) l.shift();
      l.push(d.id);
      cmpSave(l);
      btn.textContent = "В сравнении ✓";
      toast("В сравнении — жми «Сравнение» в меню");
    }
  });

  const cbtn = $("#cartBtn");
  const cartLabel = () => {
    const n = cart.qty(d.id);
    cbtn.textContent = n ? `В корзине ✓ ×${n}` : "В корзину";
  };
  cartLabel();
  cbtn.addEventListener("click", () => {
    cart.add(d.id);
    cartLabel();
  });

  const img = $("#heroImg");
  if (img) {
    img.addEventListener("error", () => {
      img.replaceWith(Object.assign(document.createElement("div"), {
        className: "thumb-ph",
        style: "font-size:96px",
        textContent: d.name.split(" ").slice(0, 2).map((w) => w[0]).join(""),
      }));
    });
  }

  if (gal.length > 1) {
    const strip = $("#gal");
    strip.innerHTML = gal.map((src, i) => `
      <button class="${i === 0 ? "on" : ""}" data-i="${i}"><img src="${src}" alt=""></button>`).join("");
    strip.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const main = $("#heroImg");
      if (!main) return;
      main.style.opacity = 0;
      setTimeout(() => {
        main.src = gal[+b.dataset.i];
        main.style.opacity = 1;
        strip.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      }, 160);
    });
  }

  if (!CALM) cards.countUp($(".dev-price"), d.price);

  scroll.watch($("#pros"), 90);
  scroll.watch($("#cons"), 90);
  scroll.watch($("#scores"), 90);
  scroll.init();
}

/* ============ сравнение ============ */

async function cmpInit() {
  const root = $("#cmpRoot");
  let ids = qs.get("ids")?.split(",").filter(Boolean) || [];
  if (ids.length < 2) ids = cmpList();

  const list = await all();
  let a = list.find((d) => d.id === ids[0]);
  let b = list.find((d) => d.id === ids[1]);

  const picker = $("#picker");

  if (!cmpUI) {
    cmpUI = true;
    picker.querySelector("[data-go]").addEventListener("click", () => {
      const [sa, sb] = picker.querySelectorAll("select");
      picker.querySelector("[data-go]").href = `compare.html?ids=${sa.value},${sb.value}`;
    });
    picker.querySelector("[data-close]").addEventListener("click", () => picker.classList.remove("open"));
  }

  function showPicker() {
    const [selA, selB] = picker.querySelectorAll("select");
    selA.innerHTML = list.map((d) =>
      `<option value="${d.id}" ${d.id === ids[0] ? "selected" : ""}>${d.name}</option>`).join("");

    const fillB = () => {
      const aDev = list.find((d) => d.id === selA.value);
      const opts = list.filter((d) => aDev && d.category === aDev.category && d.id !== aDev.id);
      selB.innerHTML = opts.map((d) =>
        `<option value="${d.id}" ${d.id === ids[1] ? "selected" : ""}>${d.name}</option>`).join("")
        || '<option value="">— нет пары в этой категории —</option>';
    };
    selA.onchange = fillB;
    fillB();
    picker.classList.add("open");
  }

  if (!a || !b || a.category !== b.category) {
    showPicker();
    document.title = "Сравнение — EazyTech";
    return;
  }

  document.title = `${a.name} vs ${b.name} — EazyTech`;

  root.innerHTML = `
    <section class="vs-head">
      <div class="vs-side">
        <span class="vs-name">${a.name}</span>
        <span class="vs-sub">${fmtScore(avg(a))} · ${money(a.price)}</span>
        <a class="lnk" href="device.html?id=${a.id}">открыть →</a>
      </div>
      <div class="vs-mark">VS</div>
      <div class="vs-side flip">
        <span class="vs-name">${b.name}</span>
        <span class="vs-sub">${fmtScore(avg(b))} · ${money(b.price)}</span>
        <a class="lnk" href="device.html?id=${b.id}">открыть →</a>
      </div>
    </section>
    <section class="sec">
      <div class="sec-head"><h2>По параметрам</h2><span class="idx">длиннее — лучше</span></div>
      <div class="stripes" id="stripes"></div>
    </section>
    <section class="sec">
      <div class="verdict" id="verdict"></div>
    </section>`;

  const { text } = cmpDraw($("#stripes"), a, b);
  scroll.watch($("#stripes"), 90);
  setTimeout(() => typeOut($("#verdict"), text), 800);
  scroll.init();
}

/* ============ запуск ============ */

fieldInit("grid");
transInit();
navFx();
rippleFx();
logoFx();
settingsFx();
cart.init(all);

if (PAGE === "home") homeInit();
if (PAGE === "cat") catInit();
if (PAGE === "device") devInit();
if (PAGE === "cmp") cmpInit();
if (PAGE === "method" || PAGE === "guide") scroll.init();
