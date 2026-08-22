const AXES = [
  "input", "ergo", "materials", "features", "reliability",
  "support", "build", "software", "value", "feel",
];

const LAB = {
  input: "Ввод / сенсор",
  ergo: "Эргономика",
  materials: "Материалы",
  features: "Фичи",
  reliability: "Надёжность",
  support: "Сервис",
  build: "Сборка",
  software: "Софт",
  value: "Ценность",
  feel: "Вау-эффект",
};

const CX = 240, CY = 240, R = 168;

function pt(angle, r) {
  return [CX + Math.cos(angle) * r, CY + Math.sin(angle) * r];
}

export function draw(wrap, bench) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 480 480");
  svg.innerHTML = `
    <g class="radar-grid spin">
      ${[0.25, 0.5, 0.75, 1].map((k) => ringPath(k * R)).join("")}
    </g>
    <g class="radar-grid">
      ${AXES.map((_, i) => {
        const a = (i / AXES.length) * Math.PI * 2 - Math.PI / 2;
        const [x, y] = pt(a, R);
        return `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}"></line>`;
      }).join("")}
    </g>
    <polygon class="radar-poly" points=""></polygon>`;

  const tip = document.createElement("div");
  tip.className = "radar-tip";
  wrap.append(tip);

  const dots = AXES.map((k, i) => {
    const a = (i / AXES.length) * Math.PI * 2 - Math.PI / 2;
    const r = (bench[k] / 10) * R;
    const [x, y] = pt(a, r);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("class", "radar-dot");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", 4);
    svg.append(dot);

    const [lx, ly] = pt(a, R + 30);
    const lab = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lab.setAttribute("class", "radar-lab");
    lab.setAttribute("x", lx);
    lab.setAttribute("y", ly + 3);
    lab.setAttribute("text-anchor", Math.abs(lx - CX) < 20 ? "middle" : lx < CX ? "end" : "start");
    lab.textContent = LAB[k];
    svg.append(lab);

    dot.addEventListener("mouseenter", () => {
      tip.innerHTML = `${LAB[k]}: <b>${bench[k].toFixed(1)}</b> / 10`;
      tip.style.left = `${(x / 480) * 100}%`;
      tip.style.top = `${(y / 480) * 100}%`;
      tip.classList.add("show");
    });
    dot.addEventListener("mouseleave", () => tip.classList.remove("show"));

    return [x, y];
  });

  const poly = svg.querySelector(".radar-poly");
  poly.setAttribute("points", dots.map((p) => p.join(",")).join(" "));

  wrap.append(svg);
}

function ringPath(r) {
  const pts = AXES.map((_, i) => {
    const a = (i / AXES.length) * Math.PI * 2 - Math.PI / 2;
    return pt(a, r).map((n) => n.toFixed(1)).join(",");
  });
  return `<polygon points="${pts.join(" ")}"></polygon>`;
}
