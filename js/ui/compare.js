import { avg } from "../data/loader.js";

const ROWS = [
  ["Общий балл", "score", 1],
  ["Цена", "price", -1],
  ["Вес (г)", "weight", -1],
  ["Ввод / сенсор", "bench.input", 1],
  ["Надёжность", "bench.reliability", 1],
  ["Фичи", "bench.features", 1],
  ["Софт", "bench.software", 1],
  ["Сборка", "bench.build", 1],
  ["Ценность", "bench.value", 1],
];

function val(d, path) {
  if (path === "score") return avg(d);
  if (path === "weight") {
    const w = d.specs["Вес"] || d.specs["вес"] || "0";
    return parseFloat(String(w).replace(",", ".")) || null;
  }
  if (path.startsWith("bench.")) {
    return d.bench ? d.bench[path.split(".")[1]] : null;
  }
  return path.split(".").reduce((o, k) => (o ? o[k] : null), d);
}

function scores(a, b, path, dir) {
  const va = val(a, path);
  const vb = val(b, path);
  if (va == null || vb == null || isNaN(va) || isNaN(vb)) return [50, 50, false, false];
  const min = Math.min(va, vb);
  const max = Math.max(va, vb);
  if (dir === 1) return [va / max * 100, vb / max * 100, va > vb, va < vb];
  const span = max - min || 1;
  return [(max - va) / span * 100, (max - vb) / span * 100, va < vb, va > vb];
}

const money = (v) => v.toLocaleString("ru-RU").replace(/,/g, " ") + " ₴";
const fmt = (v) => Math.round(v).toLocaleString("ru-RU").replace(/,/g, " ");

export function draw(list, a, b) {
  let winsA = 0, winsB = 0;
  const rows = ROWS.map(([lab, path, dir], i) => {
    const [wa, wb, winA, winB] = scores(a, b, path, dir);
    if (winA) winsA++;
    if (winB) winsB++;
    const f = (d, p) => (p === "price" ? money(val(d, p)) : p === "weight" ? val(d, p) + " г" : p === "score" ? fmt(val(d, p)) : val(d, p));
    return `
      <div class="stripe reveal" data-reveal>
        <span class="lab">${lab}</span>
        <span class="bar-a ${winA ? "win" : ""}" style="--w:${wa.toFixed(0)}%"></span>
        <span class="bar-b ${winB ? "win" : ""}" style="--w:${wb.toFixed(0)}%"></span>
      </div>`;
  }).join("");

  list.innerHTML = rows;

  const winner = winsA >= winsB ? a : b;
  const loser = winner === a ? b : a;
  const wins = Math.max(winsA, winsB);
  const text = `Победитель — ${winner.name}. Сильнее в ${wins} из ${ROWS.length} параметров. ` +
    `${loser.name} отыгрывается в ${Math.min(winsA, winsB)}. ` +
    (wins >= 6
      ? `Бери ${winner.name}, тут даже думать не надо.`
      : `Ничья по духу: смотри на бюджет и задачи.`);

  return { text };
}

export function type(el, text) {
  let i = 0;
  const cur = document.createElement("i");
  cur.className = "cur";
  el.append(cur);

  const step = () => {
    if (i >= text.length) {
      cur.remove();
      return;
    }
    cur.before(document.createTextNode(text[i++]));
    setTimeout(step, 14);
  };
  step();
}
