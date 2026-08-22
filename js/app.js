import { init as cursorInit } from "./core/cursor.js";
import { init as fieldInit } from "./core/particles.js";
import { init as transInit } from "./core/transitions.js";
import * as scroll from "./core/scroll-anim.js";
import { all, byId, ofCat } from "./data/loader.js";
import * as F from "./data/filters.js";
import * as cards from "./ui/cards.js";
import { draw as radarDraw } from "./ui/radar-chart.js";
import { draw as chartDraw } from "./ui/price-chart.js";
import { draw as cmpDraw, type as typeOut } from "./ui/compare.js";

const PAGE = document.body.dataset.page;
const CALM = matchMedia("(prefers-reduced-motion: reduce)").matches;

const money = (v) => v.toLocaleString("ru-RU").replace(/,/g, " ") + " ₴";
const CATS = { mice: "Мыши", keyboards: "Клавиатуры" };
const $ = (s, r = document) => r.querySelector(s);

/* ---------- тост ---------- */

const toastEl = document.createElement("div");
toastEl.className = "toast";
document.body.append(toastEl);
let toastTimer;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

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
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
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

  const byCat = (c) => list.filter((d) => d.category === c);

  const tiles = $("#cats");
  tiles.innerHTML = Object.entries(CATS).map(([key, name], i) => `
    <a class="cat-tile" href="category.html?cat=${key}">
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

  const featured = [...list].sort((a, b) => b.rating - a.rating).slice(0, 3);
  cards.render($("#featured"), featured);

  const stats = $("#stats");
  stats.innerHTML = `
    <div class="hstat"><b><i data-n>0</i></b><span>устройств в базе</span></div>
    <div class="hstat"><b><i data-n>0</i></b><span>категории</span></div>
    <div class="hstat"><b><i data-n>0</i></b><span>млн. маркетинга</span></div>`;
  const nums = stats.querySelectorAll("[data-n]");
  const vals = [list.length, Object.keys(CATS).length, 0];
  nums.forEach((n, i) => setTimeout(() => counter(n, vals[i]), 400 + i * 150));
}

/* ============ каталог ============ */

const qs = new URLSearchParams(location.search);
const catParam = qs.get("cat");
let catData = [];

async function catInit() {
  const title = $("#catTitle");
  title.textContent = catParam ? CATS[catParam] || "Каталог" : "Каталог";
  document.title = `${title.textContent} — EazyTech`;
  const grid = $("#grid");

  try {
    catData = await ofCat(catParam);
  } catch {
    $("#fErr").hidden = false;
    return;
  }

  if (catParam && !catData.length) {
    $("#fErr").hidden = false;
    return;
  }

  buildFilters($("#fSide"), catData);
  buildFilters($("#fSheet"), catData);
  paint(grid, catData);

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

function paint(grid, list) {
  const visible = F.apply(list);
  [...grid.children].forEach((c, i) => {
    c.style.setProperty("--i", i % 2 ? "-1" : "1");
    c.classList.add("out");
  });
  setTimeout(() => {
    cards.render(grid, visible);
    $("#fEmpty").hidden = visible.length > 0;
    $("#fCount") && paintCount(visible.length);
  }, 240);
}

function paintCount(n) {
  document.querySelectorAll("[data-num]").forEach((el) => (el.textContent = n));
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
      if (key === "rate") F.state.rate = v;
      const label = box.querySelector(`[data-${key}]`);
      if (label) label.textContent = key === "rate" ? v.toFixed(1) : money(v);
      paint($("#grid"), catData);
    };
    r.addEventListener("input", set);
    set();
  });

  box.querySelectorAll("input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.dataset.deal !== undefined) {
        F.state.deal = cb.checked;
      } else {
        const v = cb.value;
        F.state.brands = cb.checked
          ? [...F.state.brands, v]
          : F.state.brands.filter((b) => b !== v);
      }
      paint($("#grid"), catData);
    });
  });

  box.querySelector("[data-reset]").addEventListener("click", () => {
    F.reset();
    box.querySelectorAll("input[type='range']").forEach((r) => {
      r.value = r.dataset.r === "max" ? r.max : r.min;
      r.dispatchEvent(new Event("input"));
    });
    box.querySelectorAll("input[type='checkbox']").forEach((cb) => (cb.checked = false));
    paint($("#grid"), catData);
  });
}

function buildFilters(box, data) {
  const brands = [...new Set(data.map((d) => d.brand))];
  const b = F.bounds(data);
  F.state.min = b.min;
  F.state.max = b.max;

  const cbSvg = '<svg width="10" height="10" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  box.innerHTML = `
    <h3>Фильтры</h3>
    <div class="f-group open">
      <button class="f-head">Бренд <i>+</i></button>
      <div class="f-body"><div><div class="f-pad">
        ${brands.map((br) => `
          <label class="cb"><input type="checkbox" value="${br}"><span class="box">${cbSvg}</span>${br}
            <span class="n">${data.filter((d) => d.brand === br).length}</span></label>`).join("")}
      </div></div></div>
    </div>
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
      <button class="f-head">Рейтинг <i>+</i></button>
      <div class="f-body"><div><div class="f-pad">
        <div class="range-row"><label><span>от</span><b data-rate></b></label>
          <input type="range" data-r="rate" min="0" max="10" step="0.5" value="0"></div>
      </div></div></div>
    </div>
    <div class="f-group open">
      <div class="f-pad">
        <label class="cb"><input type="checkbox" data-deal><span class="box">${cbSvg}</span>Только Fair Deal</label>
      </div>
    </div>
    <p class="f-count">Показано <b data-num>${data.length}</b> из ${data.length}</p>
    <button class="btn btn--ghost" data-reset>Сброс</button>`;

  bindGroup(box);
}

/* ============ устройство ============ */

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

  const t = cards.tint(d.rating);
  const halo = t === "good" ? "var(--glow-2)" : t === "bad" ? "rgba(255,46,99,0.18)" : "var(--glow)";
  const diff = d.price - d.fairPrice;
  const fair = diff <= 0
    ? `<span class="fair-diff ok">дешевле fair на ${money(-diff)}</span>`
    : `<span class="fair-diff bad">дороже fair на ${money(diff)}</span>`;

  const tags = [];
  if (d.rating < 6.5) tags.push('<span class="tag tag-bad">Колхоз</span>');
  if (d.price <= d.fairPrice) tags.push('<span class="tag tag-deal">Fair deal</span>');

  root.innerHTML = `
    <p class="anim-fade" style="margin-bottom:20px"><a class="lnk" href="category.html?cat=${d.category}">← ${CATS[d.category] || "Каталог"}</a></p>
    <section class="dev-hero">
      <div class="dev-info">
        <div class="dev-meta">
          <span class="cat-chip">${CATS[d.category] || d.category}</span>
          ${tags.join("")}
        </div>
        <h1>${d.name}</h1>
        <p class="dev-short">${d.short}</p>
        <div class="dev-price-row">
          <span class="dev-price">${money(d.price)}</span>
          ${fair}
        </div>
        <div class="dev-actions">
          <a class="btn btn--acc" href="compare.html?ids=${d.id}">В сравнение →</a>
          <button class="btn btn--ghost" id="cmpBtn"></button>
        </div>
      </div>
      <div class="dev-visual" style="--halo:${halo}">
        <span class="halo"></span>
        ${d.image
          ? `<img src="${d.image}" alt="${d.name}">`
          : `<div class="thumb-ph" style="font-size:96px">${d.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}</div>`}
        <span class="cap">общий рейтинг ${d.rating.toFixed(1)} / 10</span>
      </div>
    </section>
    <div class="specs">
      ${Object.entries(d.specs).map(([k, v]) => `
        <div class="spec"><span>${k}</span><b>${v}</b></div>`).join("")}
    </div>
    <section class="sec">
      <div class="sec-head"><h2>Бенчмарк</h2><span class="idx">10 осей</span></div>
      <div class="radar-wrap reveal" data-reveal id="radar"></div>
    </section>
    <section class="sec">
      <div class="sec-head"><h2>Сильные и слабые</h2></div>
      <div class="pc">
        <div class="pc-col" id="pros">
          <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Сильные стороны</h3>
          ${d.pros.map((p) => `<div class="pc-item pc-pro reveal left" data-reveal>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span>${p}</span></div>`).join("")}
        </div>
        <div class="pc-col" id="cons">
          <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>Слабые стороны</h3>
          ${d.cons.map((c) => `<div class="pc-item pc-con reveal right" data-reveal>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>
            <span>${c}</span></div>`).join("")}
        </div>
      </div>
    </section>
    <section class="sec">
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
    </section>
    <section class="sec">
      <div class="sec-head"><h2>Цены по магазинам</h2><span class="idx">fair ${money(d.fairPrice)}</span></div>
      <div class="pc-chart reveal" data-reveal id="chart"></div>
    </section>`;

  radarDraw($("#radar"), d.bench);
  chartDraw($("#chart"), d);

  const btn = $("#cmpBtn");
  const has = cmpList().includes(d.id);
  btn.textContent = has ? "В сравнении ✓" : "+ Добавить к сравнению";
  btn.addEventListener("click", () => {
    const l = cmpList();
    if (l.includes(d.id)) {
      cmpSave(l.filter((x) => x !== d.id));
      btn.textContent = "+ Добавить к сравнению";
      toast("Убрано из сравнения");
    } else {
      if (l.length >= 2) l.shift();
      l.push(d.id);
      cmpSave(l);
      btn.textContent = "В сравнении ✓";
      toast("В сравнении — жми «Сравнение» в меню");
    }
  });

  const img = $(".dev-visual img");
  if (img) {
    img.addEventListener("error", () => {
      img.replaceWith(Object.assign(document.createElement("div"), {
        className: "thumb-ph",
        style: "font-size:96px",
        textContent: d.name.split(" ").slice(0, 2).map((w) => w[0]).join(""),
      }));
    });
  }

  if (!CALM) cards.countUp($(".dev-price"), d.price);

  scroll.watch($("#pros"), 90);
  scroll.watch($("#cons"), 90);
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

  picker.querySelector("[data-go]").addEventListener("click", () => {
    const [sa, sb] = picker.querySelectorAll("select");
    picker.querySelector("[data-go]").href = `compare.html?ids=${sa.value},${sb.value}`;
  });
  picker.querySelector("[data-close]").addEventListener("click", () => picker.classList.remove("open"));

  function showPicker() {
    picker.querySelectorAll("select").forEach((sel, i) => {
      sel.innerHTML = list.map((d) =>
        `<option value="${d.id}" ${d.id === ids[i] ? "selected" : ""}>${d.name}</option>`).join("");
    });
    picker.classList.add("open");
  }

  if (!a || !b) {
    showPicker();
    document.title = "Сравнение — EazyTech";
    return;
  }

  document.title = `${a.name} vs ${b.name} — EazyTech`;

  root.innerHTML = `
    <section class="vs-head">
      <div class="vs-side">
        <span class="vs-name">${a.name}</span>
        <span class="vs-sub">${a.rating.toFixed(1)} / 10 · ${money(a.price)}</span>
        <a class="lnk" href="device.html?id=${a.id}">открыть →</a>
      </div>
      <div class="vs-mark">VS</div>
      <div class="vs-side flip">
        <span class="vs-name">${b.name}</span>
        <span class="vs-sub">${b.rating.toFixed(1)} / 10 · ${money(b.price)}</span>
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

cursorInit();
fieldInit(PAGE === "device" ? "trail" : "grid");
transInit();
navFx();
rippleFx();
logoFx();

if (PAGE === "home") homeInit();
if (PAGE === "cat") catInit();
if (PAGE === "device") devInit();
if (PAGE === "cmp") cmpInit();
if (PAGE === "method") scroll.init();
